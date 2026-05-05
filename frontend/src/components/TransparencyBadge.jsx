import React from 'react';

export default function TransparencyBadge({ model, timestamp }) {
  const formatTime = (iso) => {
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-300 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-emerald-900 text-sm">
            AI-Generated Draft
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            This email was drafted by <span className="font-mono bg-white px-2 py-0.5 rounded">{model}</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Generated: {formatTime(timestamp)}
          </p>
          <p className="text-xs text-emerald-600 mt-2 font-medium">
            ✓ Please review carefully before sending. You remain responsible for all content.
          </p>
        </div>
      </div>
    </div>
  );
}
