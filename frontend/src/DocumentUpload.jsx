import React, { useState, useEffect } from 'react';

const DocumentUpload = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [documents, setDocuments] = useState([]); // Stores our RDS database rows

    // 1. Fetch all documents from our new backend GET endpoint
    const fetchDocuments = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/documents');
            if (!response.ok) throw new Error('Failed to fetch tracking data.');
            const data = await response.json();
            setDocuments(data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    // 2. Automatically load the dashboard records when the page opens
    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type !== 'application/pdf') {
            setStatusMessage('Please select a valid PDF file.');
            setFile(null);
            return;
        }
        setFile(selectedFile);
        setStatusMessage('');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setStatusMessage('Please select a PDF file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setStatusMessage('Uploading to secure cloud pipeline...');

        try {
            const response = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || 'Pipeline upload failed.');
            }

            setUploading(false);
            setStatusMessage('🎉 File successfully processed and logged!');
            setFile(null);

            // 3. Refresh the dashboard table immediately after a successful upload
            fetchDocuments();
        } catch (error) {
            setUploading(false);
            console.error('Fetch error:', error);
            setStatusMessage(error.message || 'Upload failed.');
        }
    };

    return (
        
        <div className="flex flex-col items-center justify-start min-h-screen bg-white text-slate-100 p-6 space-y-10">
            {/* Upload Card Component */}
            <div 
            style={{ backgroundColor: '#18284d' }}
            className="w-full max-w-xl bg-gray-200 border border-slate-700 rounded-xl shadow-2xl p-8 mt-6">
                <h2 className="text-2xl font-bold mb-2 text-center text-white">
                    Secure Document Upload
                </h2>
                <p className="text-white text-sm text-center mb-6">
                    S3 & RDS Integrated Storage Pipeline
                </p>

                <form onSubmit={handleUpload} className="space-y-6">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 hover:border-indigo-500 rounded-lg p-6 bg-slate-850 transition duration-200 cursor-pointer relative">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="text-center">
                            <span className="block text-sm font-medium text-gray-100">
                                {file ? file.name : 'Click to browse or drop PDF here'}
                            </span>
                            <span className="block text-xs text-gray-100 mt-1">
                                Accepts PDF format only
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={uploading || !file}
                        className={`w-full py-3 rounded-lg font-semibold text-white tracking-wide transition duration-200 ${uploading || !file
                                ? 'bg-slate-750 text-slate-500 cursor-not-allowed border border-slate-700'
                                : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30'
                            }`}
                    >
                        {uploading ? 'Processing Pipeline...' : 'Upload Document'}
                    </button>
                </form>

                {statusMessage && (
                    <div className="mt-6 p-4 rounded-lg bg-slate-850 border border-slate-700 text-sm text-center font-medium text-slate-300">
                        {statusMessage}
                    </div>
                )}
            </div>

            {/* --- NEW FLOW: Document Tracking Dashboard --- */}
            <div
                style={{ backgroundColor: '#18284d' }}
                className="w-full max-w-4xl border border-slate-700 rounded-xl shadow-2xl p-6">
                <h3 className="text-xl font-bold mb-4 text-slate-200 border-b border-slate-700 pb-2">
                    Live Document Processing Registry (RDS Tracked)
                </h3>

                {documents.length === 0 ? (
                    <p className="text-slate-500 text-sm py-4 text-center">No documents logged in database yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 text-xs font-semibold uppercase bg-slate-850">
                                    <th className="p-3">ID</th>
                                    <th className="p-3">File Name</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Uploaded At</th>
                                    <th className="p-3 text-right">Artifact Link</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50 text-sm">
                                {documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-750 transition duration-150">
                                        <td className="p-3 font-mono text-slate-500">{doc.id}</td>
                                        <td className="p-3 font-medium text-slate-200 max-w-xs truncate">{doc.file_name}</td>
                                        <td className="p-3">
                                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-xs text-slate-400">
                                            {new Date(doc.uploaded_at).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-right">
                                            <a
                                                href={doc.s3_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-3 py-1.5 rounded border border-indigo-500/30 transition duration-150"
                                            >
                                                Open S3 Link
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentUpload;