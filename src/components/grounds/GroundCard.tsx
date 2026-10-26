import React from 'react';
import { Ground } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { MapPin, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

interface GroundCardProps {
  ground: Ground;
  onViewDetails: (groundId: string) => void;
  onBookNow: (groundId: string) => void;
}

export const GroundCard: React.FC<GroundCardProps> = ({ ground, onViewDetails, onBookNow }) => {
  const isAvailable = ground.availability === 'AVAILABLE';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Ground Image Container */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-100">
        <img
          src={ground.imageUrl}
          alt={ground.groundName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3.5 left-3.5">
          <StatusBadge status={ground.availability} size="sm" />
        </div>

        {/* Hourly Price Tag */}
        <div className="absolute bottom-3.5 right-3.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-white/20">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Per Hour</div>
          <div className="text-base font-black text-slate-900">
            ₹{ground.hourlyPrice.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Location tag bottom-left */}
        <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 text-white text-xs font-semibold drop-shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{ground.location}</span>
        </div>
      </div>

      {/* Ground Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {ground.groundName}
          </h3>

          <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {ground.description}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{ground.openingTime} – {ground.closingTime}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Turf</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onViewDetails(ground.groundId)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors text-center cursor-pointer"
          >
            View Details
          </button>
          <button
            onClick={() => onBookNow(ground.groundId)}
            disabled={!isAvailable}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 text-center cursor-pointer ${
              isAvailable
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>{isAvailable ? 'Book Now' : 'Closed'}</span>
            {isAvailable && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
