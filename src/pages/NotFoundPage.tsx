import React from 'react';
import { Compass, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-4">
        <Compass className="w-8 h-8" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
        404 Not Found
      </span>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-3">
        Page Not Found
      </h1>
      <p className="text-sm text-slate-500 max-w-sm mt-2 mb-6">
        The pitch you were looking for is off-limits or does not exist.
      </p>
      <button
        onClick={() => onNavigate('/')}
        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>
    </div>
  );
};
