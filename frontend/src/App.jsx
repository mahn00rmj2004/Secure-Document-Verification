import React, { useState } from 'react';
import DocumentUpload from './DocumentUpload';
import VerifierDashboard from './VerifierDashboard';
import AdminAnalytics from './AdminAnalytics';
import Navbar from './Navbar'; 

function App() {
  const [activeTab, setActiveTab] = useState('upload');

  // Helper function to handle tab switching safely without form submission side effects
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="bg-gray-100 min-h-screen text-slate-800 font-sans selection:bg-blue-500/20">
      
      {/* Custom Premium Navigation Bar Component */}
      <Navbar currentPage={activeTab} setCurrentPage={handleTabChange} />

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        
        {/* Safe isolated tab views */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <DocumentUpload />
          </div>
        )}

        {activeTab === 'verify' && (
          <div className="space-y-4">
            <VerifierDashboard />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <AdminAnalytics />
          </div>
        )}
        
      </main>
    </div>
  );
}

export default App;