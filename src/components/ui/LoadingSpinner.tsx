import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  size = 'md',
  fullPage = false
}) => {
  const spinnerSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-slate-600">
      <div className={`relative ${spinnerSize}`}>
        <div className="w-full h-full rounded-full border-3 border-emerald-100 border-t-emerald-600 animate-spin" />
      </div>
      {label && <p className="text-sm font-medium text-slate-600">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center w-full py-16">
        {content}
      </div>
    );
  }

  return content;
};
