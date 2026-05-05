import React from 'react';

export default function Card({ children, className = '', variant = 'default' }) {
  const variants = {
    default: 'bg-white border border-gray-200 shadow-md',
    elevated: 'bg-white border border-gray-200 shadow-lg',
    flat: 'bg-gray-50 border border-gray-200',
    highlight: 'bg-emerald-50 border border-emerald-200',
  };

  return (
    <div className={`rounded-lg p-6 transition-smooth ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
