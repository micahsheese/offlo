import React from 'react';

export default function Login() {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const loginUrl = `${API_BASE}/auth/login`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">🌿 Offlo</h1>
          <p className="text-emerald-700">Ethical AI Email</p>
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-gray-600 text-center">
            Draft emails with transparency, human control, and carbon awareness.
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-emerald-600 mr-2">✓</span>
              <span>Transparent AI — recipients know it's AI-drafted</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-600 mr-2">✓</span>
              <span>You always approve before sending</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-600 mr-2">✓</span>
              <span>Carbon footprint tracked and offset</span>
            </li>
          </ul>
        </div>

        <a
          href={loginUrl}
          className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition duration-200 text-center"
        >
          Sign In with Gmail or Outlook
        </a>

        <p className="text-xs text-gray-500 text-center mt-4">
          We'll securely connect to your email. You stay in control.
        </p>
      </div>
    </div>
  );
}
