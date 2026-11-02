import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  borderAccent?: boolean;
  id?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  borderAccent = false,
  id
}) => {
  return (
    <div
      id={id}
      className={`bg-white rounded-2xl border ${
        borderAccent ? 'border-brand-200' : 'border-slate-200/90'
      } shadow-soft ${
        hoverEffect ? 'transition-all duration-300 hover:shadow-premium hover:-translate-y-1 hover:border-brand-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
