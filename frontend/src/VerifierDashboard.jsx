import React, { useState, useEffect } from 'react';

const VerifierDashboard = () => {
    const [pendingDocs, setPendingDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState('');

    // Fetch only the documents waiting for review
    const fetchPendingDocs = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/pending-docs');
            if (!response.ok) throw new Error('Failed to load pending queue.');
            const data = await response.json();
            setPendingDocs(data);
        } catch (error) {
            console.error('Error fetching pending docs:', error);
        }
    };

    useEffect(() => {
        fetchPendingDocs();
    }, []);

    // Securely handle item viewing via Backend Presigned URLs
    const handleView = async (docId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/view-doc/${docId}`);
            if (!response.ok) throw new Error('Could not authorize secure link.');
            const data = await response.json();

            // Open the temporary, authorized S3 link in a fresh browser tab
            window.open(data.presignedUrl, '_blank');
        } catch (error) {
            alert('Security access token generation failed: ' + error.message);
        }
    };

    // Process Approval or Rejection choices
    const handleDecision = async (docId, decision) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/decide-doc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: docId, status: decision })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Decision submittal dropped.');

            setActionMessage(`Success: Document marked as ${decision}!`);
            // Refresh the dashboard list immediately to drop the processed item out
            await fetchPendingDocs();
        } catch (error) {
            setActionMessage('Error updating status: ' + error.message);
        } finally {
            setLoading(false);
            setTimeout(() => setActionMessage(''), 4000); // Clear notification banner
        }
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-screen bg-white text-slate-800 p-6 space-y-10">
            <div className="space-y-4 w-full max-w-5xl">
                <div 
                style={{ backgroundColor: '#18284d' }}
                className="w-full max-w-5xl bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 mt-4">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-6">

                        <div>
                            <h2 className="text-2xl font-bold text-white">Verifier Document Console</h2>
                            <p className="text-slate-400 text-sm mt-0.5">Role-Based Review & Temporal Security View Layer</p>
                        </div>
                        <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs px-3 py-1.5 rounded-md font-mono font-bold">
                            Pending Queue Length: {pendingDocs.length}
                        </span>
                    </div>

                    {actionMessage && (
                        <div className="mb-6 p-4 rounded-lg bg-slate-850 border border-slate-700 text-sm text-center font-medium text-indigo-300 animate-pulse">
                            {actionMessage}
                        </div>
                    )}

                    {pendingDocs.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-slate-700 rounded-lg bg-slate-850">
                            <p className="text-slate-500 font-medium">All clear! No documents are currently awaiting manual verification.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-700 text-slate-400 text-xs font-semibold uppercase bg-slate-850">
                                        <th className="p-3">Doc ID</th>
                                        <th className="p-3">Document Artifact Title</th>
                                        <th className="p-3">Current State</th>
                                        <th className="p-3 text-center">Security Access</th>
                                        <th className="p-3 text-right">Review Validation Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/40 text-sm">
                                    {pendingDocs.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-slate-750/50 transition duration-150">
                                            <td className="p-3 font-mono text-slate-500">#{doc.id}</td>
                                            <td className="p-3 font-medium text-slate-200 max-w-sm truncate">{doc.file_name}</td>
                                            <td className="p-3">
                                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-950 text-amber-400 border border-amber-800 tracking-wide">
                                                    {doc.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => handleView(doc.id)}
                                                    className="text-xs font-semibold bg-slate-700 hover:bg-slate-600 border border-slate-600 px-3 py-1.5 rounded transition duration-150 text-slate-200"
                                                >
                                                    👁️ Generate Secure Link
                                                </button>
                                            </td>
                                            <td className="p-3 text-right space-x-2">
                                                <button
                                                    disabled={loading}
                                                    onClick={() => handleDecision(doc.id, 'APPROVED')}
                                                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-1.5 rounded shadow-md transition duration-150"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    disabled={loading}
                                                    onClick={() => handleDecision(doc.id, 'REJECTED')}
                                                    className="text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-4 py-1.5 rounded shadow-md transition duration-150"
                                                >
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>

    );
};

export default VerifierDashboard;