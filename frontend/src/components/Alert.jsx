import React from 'react';

export default function Alert({ type = 'info', title, message, onClose }) {
  const variants = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      icon: '✓',
      iconBg: 'bg-green-100 text-green-700',
      title: 'text-green-900',
      text: 'text-green-800',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      icon: '✕',
      iconBg: 'bg-red-100 text-red-700',
      title: 'text-red-900',
      text: 'text-red-800',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      icon: '⚠',
      iconBg: 'bg-yellow-100 text-yellow-700',
      title: 'text-yellow-900',
      text: 'text-yellow-800',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      icon: 'ℹ',
      iconBg: 'bg-blue-100 text-blue-700',
      title: 'text-blue-900',
      text: 'text-blue-800',
    },
  };

  const v = variants[type];

  return (
    <div className={`${v.bg} border ${v.border} rounded-lg p-4 mb-4 animate-fadeIn`}>
      <div className="flex items-start gap-3">
        <div className={`${v.iconBg} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm`}>
          {v.icon}
        </div>
        <div className="flex-1 min-w-0">
          {title && <p className={`font-semibold text-sm ${v.title}`}>{title}</p>}
          <p className={`text-sm ${v.text} ${title ? 'mt-1' : ''}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${v.text} hover:opacity-70 transition-smooth`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
