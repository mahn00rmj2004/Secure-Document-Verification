import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register Chart.js components globally
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AdminAnalytics = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchMetrics = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/analytics');
            if (!response.ok) throw new Error('Failed to retrieve system analytics.');
            const data = await response.json();
            setAnalyticsData(data);
            setLoading(false);
        } catch (error) {
            console.error('Error grabbing database stats:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 text-indigo-400">
                <p className="text-xl font-mono animate-pulse">Querying AWS Infrastructure metrics...</p>
            </div>
        );
    }

    // Structure the data layout for our gorgeous Pie Chart
    const pieData = {
        labels: ['Pending Review', 'Approved Keys', 'Rejected Items'],
        datasets: [
            {
                data: [
                    analyticsData.summary.PENDING,
                    analyticsData.summary.APPROVED,
                    analyticsData.summary.REJECTED,
                ],
                backgroundColor: ['rgba(245, 158, 11, 0.6)', 'rgba(16, 185, 129, 0.6)', 'rgba(244, 63, 94, 0.6)'],
                borderColor: ['#f59e0b', '#10b981', '#f43f5e'],
                borderWidth: 2,
            },
        ],
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-screen bg-white text-slate-100 p-6 space-y-8">
            <div className="w-full max-w-6xl mt-4">
                <h2 className="text-3xl font-extrabold text-indigo-400">System Dashboard Analytics</h2>
                <p className="text-slate-400 text-sm mt-1">Real-time RDS Aggregations & Security Audit Trail</p>
            </div>

            {/* Top Row: Metrics Overview Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-6xl">
                <div 
                style={{ backgroundColor: '#18284d' }}
                className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-xl">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Managed Assets</span>
                    <span className="text-3xl font-bold text-slate-100 block mt-2">{analyticsData.totalDocuments}</span>
                </div>
                <div
                style={{ backgroundColor: '#18284d' }}
                className="bg-slate-800 border border-emerald-900/40 rounded-xl p-5 shadow-xl">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Approved Rows</span>
                    <span className="text-3xl font-bold text-emerald-400 block mt-2">{analyticsData.summary.APPROVED}</span>
                </div>
                <div
                style={{ backgroundColor: '#18284d' }}
                className="bg-slate-800 border border-rose-900/40 rounded-xl p-5 shadow-xl">
                    <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">Rejected Rows</span>
                    <span className="text-3xl font-bold text-rose-400 block mt-2">{analyticsData.summary.REJECTED}</span>
                </div>
                <div
                style={{ backgroundColor: '#18284d' }}
                className="bg-slate-800 border border-amber-900/40 rounded-xl p-5 shadow-xl">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">Pending Actions</span>
                    <span className="text-3xl font-bold text-amber-400 block mt-2">{analyticsData.summary.PENDING}</span>
                </div>
            </div>

            {/* Split Row: Visual Data Graphs & System Audit Log Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">
                {/* Visual Chart Card */}
                <div 
                style={{ backgroundColor: '#18284d' }}
                className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 flex flex-col items-center justify-center">
                    <h3 
                    className="text-lg font-bold text-slate-200 mb-6 text-center w-full border-b border-slate-700 pb-2">
                        Status Metrics Ratio
                    </h3>
                    <div className="w-64 h-64 max-w-full">
                        <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: true }} />
                    </div>
                </div>

                {/* Secure Audit Trail Log Workspace */}
                <div
                style={{ backgroundColor: '#18284d' }}
                className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6">
                    <h3 
                    
                    className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2">
                        System Security Audit Trail (Recent Activity)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 text-xs font-semibold bg-slate-850">
                                    <th className="p-3">Log Event ID</th>
                                    <th className="p-3">File Target Name</th>
                                    <th className="p-3">Status State</th>
                                    <th className="p-3 text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30 text-xs">
                                {analyticsData.auditTrail.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-750/30 transition duration-150">
                                        <td className="p-3 font-mono text-indigo-400">#EVT-00{log.id}</td>
                                        <td className="p-3 font-medium text-slate-300 max-w-xs truncate">{log.file_name}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                log.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                                log.status === 'REJECTED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                                                'bg-amber-950 text-amber-400 border border-amber-800'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right text-slate-400">
                                            {new Date(log.uploaded_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;