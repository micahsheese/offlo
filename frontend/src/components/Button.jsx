import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
  className = '',
  ...props
}) {
  const baseStyles = 'font-semibold rounded-lg transition-smooth focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:outline-emerald-600',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus-visible:outline-gray-600',
    ghost: 'text-emerald-600 hover:bg-emerald-50 focus-visible:outline-emerald-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus-visible:outline-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {isLoading && <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {children}
      </span>
    </button>
  );
}
