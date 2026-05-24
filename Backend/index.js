const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
// Added GetObjectCommand to your existing S3 imports
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
// Added getSignedUrl utility for secure temporal viewing link generation
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure Multer for in-memory file handling
const upload = multer({ storage: multer.memoryStorage() });

// Configure Amazon RDS MySQL Connection (Notice: Database is omitted here purposely)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: 3306,
    ssl: { rejectUnauthorized: false }
};

// Configure Amazon S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Helper: Initialize Database and Table on Startup
async function initDB() {
    try {
        // 1. Log into the root server room
        const connection = await mysql.createConnection(dbConfig);
        
        // 2. Using .query() to automatically build the database folder using your .env name
        console.log(`Verifying database folder "${process.env.DB_NAME}" exists on AWS...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        
        // 3. Using .query() to step inside that database folder
        await connection.query(`USE \`${process.env.DB_NAME}\`;`);

        // 4. Using .query() to build your tracking table safely inside it
        await connection.query(`
            CREATE TABLE IF NOT EXISTS documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                file_name VARCHAR(255) NOT NULL,
                s3_url VARCHAR(512) NOT NULL,
                status VARCHAR(50) DEFAULT 'PENDING',
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await connection.end();
        console.log("MySQL 'documents' table checked/created successfully.");
    } catch (err) {
        console.error("Failed to initialize database table:", err.message);
    }
}
initDB();

// --- Core Feature 1: The Secure Upload Flow ---
app.post('/api/upload', upload.single('file'), async (req, res) => {
    let dbConnection;
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        // 1. Define unique file key to prevent overwriting in S3
        const uniqueFileName = `${Date.now()}-${file.originalname}`;
        const bucketName = process.env.AWS_BUCKET_NAME; 

        // 2. Configure S3 Upload Parameters
        const s3Params = {
            Bucket: bucketName,
            Key: uniqueFileName,
            Body: file.buffer,
            ContentType: file.mimetype
        };

        // 3. Command S3 to upload the binary buffer
        console.log(`Uploading ${file.originalname} to S3 bucket: ${bucketName}...`);
        await s3.send(new PutObjectCommand(s3Params));
        
        // Construct the permanent S3 visual tracking URL
        const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

        // 4. Connect to RDS and select the database folder dynamically using .query()
        console.log("Logging record entry to Amazon RDS...");
        dbConnection = await mysql.createConnection(dbConfig);
        await dbConnection.query(`USE \`${process.env.DB_NAME}\`;`);
        
        const insertQuery = `
            INSERT INTO documents (file_name, s3_url, status) 
            VALUES (?, ?, 'PENDING');
        `;
        // .execute() is perfectly fine here because INSERT is a standard DML statement
        const [result] = await dbConnection.execute(insertQuery, [file.originalname, s3Url]);

        // 5. Respond back with everything generated
        res.json({
            message: "Pipeline processing completed successfully!",
            documentId: result.insertId,
            fileName: file.originalname,
            s3Url: s3Url,
            status: "PENDING"
        });

    } catch (err) {
        console.error("Pipeline failure:", err);
        res.status(500).json({ error: "AWS Pipeline failed", details: err.message });
    } finally {
        if (dbConnection) await dbConnection.end();
    }
});

// --- Core Feature 2: Real-Time Document Fetch Route ---
app.get('/api/documents', async (req, res) => {
    let dbConnection;
    try {
        dbConnection = await mysql.createConnection(dbConfig);
        await dbConnection.query(`USE \`${process.env.DB_NAME}\`;`);
        
        // Fetch all logging records from oldest to newest or vice-versa
        const [rows] = await dbConnection.execute('SELECT * FROM documents ORDER BY uploaded_at DESC;');
        res.json(rows);
    } catch (err) {
        console.error("Failed to fetch records:", err);
        res.status(500).json({ error: "Database retrieval failed", details: err.message });
    } finally {
        if (dbConnection) await dbConnection.end();
    }
});

// --- Phase 3 Feature 2: Fetch PENDING Documents Only ---
app.get('/api/pending-docs', async (req, res) => {
    let dbConnection;
    try {
        dbConnection = await mysql.createConnection(dbConfig);
        await dbConnection.query(`USE \`${process.env.DB_NAME}\`;`);
        
        const [rows] = await dbConnection.execute(
            "SELECT * FROM documents WHERE status = 'PENDING' ORDER BY uploaded_at DESC;"
        );
        res.json(rows);
    } catch (err) {
        console.error("Failed to fetch pending queue:", err);
        res.status(500).json({ error: "Pending filter query dropped", details: err.message });
    } finally {
        if (dbConnection) await dbConnection.end();
    }
});

// --- Phase 3 Feature 2: Secure 5-Minute Presigned URL Generator ---
app.get('/api/view-doc/:id', async (req, res) => {
    let dbConnection;
    try {
        const docId = req.params.id;

        dbConnection = await mysql.createConnection(dbConfig);
        await dbConnection.query(`USE \`${process.env.DB_NAME}\`;`);
        const [rows] = await dbConnection.execute('SELECT s3_url FROM documents WHERE id = ?;', [docId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Document entry row not flagged in relational database." });
        }

        // Parse out the unique key identifier from the full S3 string resource link
        const s3Url = rows[0].s3_url;
        const urlParts = s3Url.split('/');
        const s3Key = urlParts[urlParts.length - 1]; 

        // Structure a Get request context pointer command
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
        });

        // Sign the command payload to expire in exactly 300 seconds
        console.log(`Generating temporal secure authorization key token for artifact filename: ${s3Key}`);
        const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

        res.json({ presignedUrl });
    } catch (err) {
        console.error("Presigned security generation error:", err);
        res.status(500).json({ error: "Temporal link signature loop dropped", details: err.message });
    } finally {
        if (dbConnection) await dbConnection.end();
    }
});

// --- Phase 3 Feature 2: Update Review State Decision Engine ---
app.post('/api/decide-doc', async (req, res) => {
    let dbConnection;
    try {
        const { id, status } = req.body; 

        if (!id || !['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: "Invalid document ID parameters or parsing decision tag string structure." });
        }

        dbConnection = await mysql.createConnection(dbConfig);
        await dbConnection.query(`USE \`${process.env.DB_NAME}\`;`);

        const updateQuery = 'UPDATE documents SET status = ? WHERE id = ?;';
        await dbConnection.execute(updateQuery, [status, id]);

        console.log(`Document Entry #${id} status state committed inside RDS instance as: ${status}`);
        res.json({ message: `Successfully changed target entry state mapping structure to ${status}.` });
    } catch (err) {
        console.error("State modification entry tracking breakdown:", err);
        res.status(500).json({ error: "Relational write updating execution transaction loop failure", details: err.message });
    } finally {
        if (dbConnection) await dbConnection.end();
    }
});

// Test Route
app.get('/test-db', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.query(`USE \`${process.env.DB_NAME}\`;`);
        const [rows] = await connection.execute('SELECT NOW();');
        await connection.end();
        res.json({ message: "Successfully connected to Amazon RDS!", time: rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Database unreachable", details: err.message });
    }
});

// --- Phase 4 Feature 3: Data Analytics Aggregator Route ---
app.get('/api/analytics', async (req, res) => {
    let dbConnection;
    try {
        dbConnection = await mysql.createConnection(dbConfig);
        await dbConnection.query(`USE \`${process.env.DB_NAME}\`;`);
        
        // Query 1: Get aggregate counts grouped by status
        const [counts] = await dbConnection.execute(
            'SELECT status, COUNT(*) as count FROM documents GROUP BY status;'
        );

        // Query 2: Get recent logs for the Audit Trail timeline
        const [recentLogs] = await dbConnection.execute(
            'SELECT id, file_name, status, uploaded_at FROM documents ORDER BY uploaded_at DESC LIMIT 5;'
        );

        // Format raw SQL rows into a clean, predictable JSON object for frontend charts
        const stats = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
        counts.forEach(row => {
            if (stats[row.status] !== undefined) {
                stats[row.status] = parseInt(row.count, 10);
            }
        });

        res.json({
            summary: stats,
            totalDocuments: stats.PENDING + stats.APPROVED + stats.REJECTED,
            auditTrail: recentLogs
        });
    } catch (err) {
        console.error("Analytics extraction failure:", err);
        res.status(500).json({ error: "Failed to compile system metrics", details: err.message });
    } finally {
        if (dbConnection) await dbConnection.end();
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running smoothly on port ${PORT}`));