import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outline' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-200';
  
  const variantStyles = {
    elevated: 'bg-white shadow-sm border border-gray-100 hover:shadow-md',
    outline: 'bg-white border border-gray-200',
    flat: 'bg-gray-50 border border-gray-100'
  }[variant];

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }[padding];

  return (
    <div className={`${baseStyles} ${variantStyles} ${paddingStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

