import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    // The backend handles the OAuth callback and sets a cookie
    // This page just needs to redirect to dashboard
    const timeout = setTimeout(() => {
      navigate('/dashboard');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-emerald-900 mb-4">Connecting...</h2>
        <p className="text-gray-600 mb-6">Setting up your account. Redirecting shortly.</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    </div>
  );
}
