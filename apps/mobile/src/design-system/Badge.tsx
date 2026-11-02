import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = ''
}) => {
  const variantStyles = {
    success: 'bg-[#E6F4EF] text-[#064E3B] border-[#0B6E4F]/20',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200'
  }[variant];

  const dotColors = {
    success: 'bg-[#0B6E4F]',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    neutral: 'bg-gray-400'
  }[variant];

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantStyles} ${sizeStyles} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors}`} />}
      {children}
    </span>
  );
};
