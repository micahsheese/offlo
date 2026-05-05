import React from 'react';
import { Button, Card } from '../components';

export default function Login() {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const loginUrl = `${API_BASE}/auth/login`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🌿</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Offlo</h1>
          <p className="text-gray-600">Ethical AI for your emails</p>
        </div>

        <Card variant="elevated" className="mb-6">
          <div className="space-y-4">
            <p className="text-gray-700 text-center leading-relaxed">
              Draft emails with confidence. Every AI draft is transparent, human-approved, and carbon-tracked.
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <span className="text-emerald-600 flex-shrink-0 font-bold text-lg">✓</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Fully Transparent</p>
                  <p className="text-gray-600 text-xs">Recipients know it's AI-drafted</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-600 flex-shrink-0 font-bold text-lg">✓</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Always Under Control</p>
                  <p className="text-gray-600 text-xs">You approve every email before it sends</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-600 flex-shrink-0 font-bold text-lg">✓</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Carbon Aware</p>
                  <p className="text-gray-600 text-xs">We offset 2x your emissions</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <a href={loginUrl} className="block w-full mb-4">
          <Button variant="primary" size="lg" className="w-full">
            📧 Sign In with Gmail or Outlook
          </Button>
        </a>

        <p className="text-xs text-gray-500 text-center mb-6">
          14 days free. No card required.
        </p>

        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>Secure OAuth connection — we never see your password</p>
          <p>Your emails stay yours. We only help you draft better.</p>
        </div>
      </div>
    </div>
  );
}
