import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-emerald-900 mb-4">Offlo</h1>
        <p className="text-xl text-emerald-700 mb-8">Ethical AI Email — Coming Soon</p>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <p className="text-gray-600 mb-4">Dashboard placeholder — under construction</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Email draft interface</li>
            <li>Approval workflow</li>
            <li>Impact dashboard</li>
            <li>Account settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
