import React from 'react';

export default function Login() {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const loginUrl = `${API_BASE}/auth/login`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-8 py-12">
      <div className="max-w-sm w-full">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">🌿</div>
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">Offlo</h1>
          <p className="text-lg text-emerald-700">Ethical AI for your emails</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-xl p-8 border border-emerald-100 mb-8">
          <div className="space-y-6 mb-8">
            <p className="text-emerald-900 text-center leading-relaxed">
              Draft emails with transparency, human control, and carbon awareness.
            </p>
            
            <div className="space-y-4 pt-2">
              <div className="flex gap-3 items-start">
                <span className="text-2xl flex-shrink-0">🔍</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Fully Transparent</p>
                  <p className="text-gray-600 text-xs mt-0.5">Recipients know your email is AI-drafted</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="text-2xl flex-shrink-0">👤</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Always in Control</p>
                  <p className="text-gray-600 text-xs mt-0.5">You approve every email before sending</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="text-2xl flex-shrink-0">🌍</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Carbon Negative</p>
                  <p className="text-gray-600 text-xs mt-0.5">We offset 2x your emissions automatically</p>
                </div>
              </div>
            </div>
          </div>

          <a href={loginUrl} className="block w-full mb-4">
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 text-lg">
              📧 Sign In with Gmail or Outlook
            </button>
          </a>

          <p className="text-xs text-gray-500 text-center">
            14 days free. No card required.
          </p>
        </div>

        {/* Trust Footer */}
        <div className="text-center text-xs text-emerald-700 space-y-1">
          <p>🔒 Secure OAuth — we never see your password</p>
          <p>📬 Your emails stay yours — we only help you draft better</p>
        </div>
      </div>
    </div>
  );
}
