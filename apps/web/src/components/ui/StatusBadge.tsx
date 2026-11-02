import React from 'react';
import { FeatureStatus } from '@/types';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: FeatureStatus | 'Active' | 'Due' | 'Urgent' | 'Draft' | 'Target';
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'md'
}) => {
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;
  let displayText = status;

  if (status === 'Phase 1 UI / Core Workflow P0' || status === 'Active') {
    colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    Icon = CheckCircle2;
  } else if (status === 'Planned P1' || status === 'Draft') {
    colorStyles = 'bg-amber-50 text-amber-800 border-amber-200';
    Icon = Clock;
  } else if (status === 'Planned P2') {
    colorStyles = 'bg-blue-50 text-blue-800 border-blue-200';
    Icon = Sparkles;
  } else if (status === 'Urgent') {
    colorStyles = 'bg-red-50 text-red-800 border-red-200 font-semibold';
    Icon = CheckCircle2;
  } else if (status === 'Target') {
    colorStyles = 'bg-brand-50 text-brand-900 border-brand-200 font-medium';
    Icon = Sparkles;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClass} ${colorStyles} ${className}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span>{displayText}</span>
    </span>
  );
};
