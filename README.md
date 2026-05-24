# DoVerify v2.0 — Secure Digital Document Verification Platform

DoVerify v2.0 is a secure, full-stack digital document verification platform built with a React/Vite frontend and a Node.js backend environment. The architecture leverages AWS cloud capabilities to manage secure uploads, handle metadata via a relational layer, and provide administrative dashboard insights.

---

## 🚀 Key Features

* **Client Upload Portal:** Interactive drag-and-drop file interface restricted to secure PDF uploads.
* **Verifier Document Console:** An administrative view tracking pending queues, current approval states, and temporal secure viewing links.
* **System Dashboard Analytics:** Real-time metrics visualization showing total managed assets, approved/rejected tracks, and recent security audit logs.
* **Cloud Integrity Pipeline:** Fully automated relational database integration combined with secure artifact object storage.

---

## 🛠️ Architecture & Tech Stack

### Frontend & UI Layer
* **React.js & Vite:** Ultrafast, state-driven build tool and frontend component architecture.
* **Tailwind CSS & PostCSS:** Utility-first styling framework configured for a custom deep-blue user interface.

### Backend & Cloud Infrastructure (AWS)
* **Node.js:** Fast, asynchronous backend processing layer.
* **Amazon S3:** Secure, decoupled object storage hosting verified document artifacts.
* **Amazon RDS:** Relational database tracking live application schemas, timestamps, and row entries.
* **Amazon CloudWatch:** System metric monitoring and unauthorized access detection tracking.

---

## 📁 Project Structure

```text
AWS/
├── Backend/                 # Node.js backend service
│   ├── node_modules/        # Backend external dependencies (Ignored)
│   ├── .env                 # Sensitive environment credentials (Ignored)
│   ├── index.js             # Server entry point
│   └── package.json         # Backend manifest
├── frontend/                # React UI application (Vite + Tailwind)
│   ├── node_modules/        # Frontend dependencies (Ignored)
│   ├── public/              # Static assets
│   ├── src/                 # React components and logic
│   ├── index.html           # Single Page Application root
│   ├── tailwind.config.js   # Style configurations
│   └── vite.config.js       # Vite server configuration
└── .gitignore               # Global workspace rule coordinator

### 1.Clone the repository
git clone [https://github.com/mahn00rmj2004/Secure-Document-Verification.git](https://github.com/mahn00rmj2004/Secure-Document-Verification.git)
cd Secure-Document-Verification

### 2. Environment Configuration
Because your security keys are explicitly excluded from version control to prevent unauthorized AWS resource access, you must set them up locally.

Navigate to the `Backend` directory and create a `.env` file if it doesn't exist:
```bash
cd Backend
touch .env

AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
DB_HOST=your_rds_endpoint_here
DB_PASSWORD=your_database_password_here


### 3. Launching the Platform

#### Run the Backend Server
```bash
cd Backend
npm install
npm start

#### Run the Frontend Interface
Open a secondary terminal window and navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev





