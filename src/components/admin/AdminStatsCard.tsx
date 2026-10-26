import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'blue' | 'amber' | 'purple' | 'slate';
}

export const AdminStatsCard: React.FC<AdminStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'emerald'
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100'
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-start justify-between">
      <div className="space-y-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl border ${variantStyles[variant]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};
