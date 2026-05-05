import React from 'react';

export default function Input({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />}
        <input
          className={`w-full px-4 py-2.5 border rounded-lg transition-smooth focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
}
