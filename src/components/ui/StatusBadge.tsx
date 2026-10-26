import React from 'react';
import { BookingStatus, PaymentStatus, GroundAvailability } from '../../types';

interface StatusBadgeProps {
  status: BookingStatus | PaymentStatus | GroundAvailability | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = String(status).toUpperCase();

  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';
  let label = status;

  switch (s) {
    case 'AVAILABLE':
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      label = 'Available';
      break;
    case 'UNAVAILABLE':
      style = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      label = 'Unavailable';
      break;
    case 'CONFIRMED':
      style = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
      dotColor = 'bg-emerald-500';
      label = 'Confirmed';
      break;
    case 'PENDING_PAYMENT':
      style = 'bg-amber-50 text-amber-800 border-amber-200';
      dotColor = 'bg-amber-500 animate-pulse';
      label = 'Pending Payment';
      break;
    case 'CANCELLED':
      style = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      label = 'Cancelled';
      break;
    case 'COMPLETED':
      style = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-500';
      label = 'Completed';
      break;
    case 'SUCCESS':
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      label = 'Success';
      break;
    case 'PENDING':
      style = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      label = 'Pending';
      break;
    case 'FAILED':
      style = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      label = 'Failed';
      break;
    case 'REFUNDED':
      style = 'bg-purple-50 text-purple-700 border-purple-200';
      dotColor = 'bg-purple-500';
      label = 'Refunded';
      break;
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${padding} ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};
