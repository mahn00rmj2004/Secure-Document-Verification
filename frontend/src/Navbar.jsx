import React from 'react';

export default function Navbar({ currentPage, setCurrentPage }) {
  const navItems = [
    { id: 'upload', label: 'Client Upload Portal' },
    { id: 'verify', label: 'Verifier Console' },
    { id: 'analytics', label: 'Security & Analytics' }
  ];

  return (
    <nav 
      style={{ backgroundColor: '#18284d' }} 
      className="border-b border-slate-800 px-6 py-4 mb-8"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            DoVerify<span className="text-blue-500 font-medium text-sm">v2.0</span>
          </h1>
        </div>
        
        <div 
          style={{ backgroundColor: '#18284d' }} 
          className="flex gap-2 p-1 rounded-xl border border-slate-800"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button" // <--- CRITICAL FIX: Prevents page refresh/form submission
              onClick={() => setCurrentPage(item.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                currentPage === item.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}