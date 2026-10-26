import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const iconSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className={`inline-flex items-center gap-2.5 font-bold tracking-tight text-slate-900 select-none ${className}`}>
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-md shadow-emerald-700/20 ${iconSize}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4/5 h-4/5">
          <circle cx="12" cy="12" r="10" />
          <path d="m4.93 4.93 4.24 4.24" />
          <path d="m14.83 14.83 4.24 4.24" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${textSize} font-black tracking-tight text-slate-900 flex items-center`}>
          Cricket<span className="text-emerald-600">Book</span>
        </span>
        {size === 'lg' && (
          <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-500 mt-0.5">
            Ground Reservation System
          </span>
        )}
      </div>
    </div>
  );
};
