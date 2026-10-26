import React, { useEffect, useState } from 'react';
import { groundsApi } from '../services/api';
import { Ground } from '../types';
import { AvailabilityChecker } from '../components/booking/AvailabilityChecker';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import {
  MapPin,
  Clock,
  ArrowLeft,
  Shield,
  Zap,
  Coffee,
  Car,
  ShowerHead,
  Volume2
} from 'lucide-react';

interface GroundDetailsPageProps {
  groundId: string;
  onNavigate: (path: string) => void;
}

export const GroundDetailsPage: React.FC<GroundDetailsPageProps> = ({ groundId, onNavigate }) => {
  const [ground, setGround] = useState<Ground | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGround() {
      setLoading(true);
      setError(null);
      try {
        const res = await groundsApi.getGround(groundId);
        if (res.success && res.data) {
          setGround(res.data);
        } else {
          setError(res.message || 'Ground details could not be retrieved.');
        }
      } catch {
        setError('Failed to connect to backend server.');
      } finally {
        setLoading(false);
      }
    }
    loadGround();
  }, [groundId]);

  if (loading) {
    return <LoadingSpinner label="Loading ground details..." fullPage />;
  }

  if (error || !ground) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorMessage
          message={error || 'Ground not found.'}
          onRetry={() => window.location.reload()}
        />
        <button
          onClick={() => onNavigate('/grounds')}
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Grounds</span>
        </button>
      </div>
    );
  }

  const amenities = [
    { icon: Zap, label: 'High-Lux Match Floodlights' },
    { icon: Shield, label: 'Tournament Pitch & Nets' },
    { icon: Coffee, label: 'Player Dugouts & Cafeteria' },
    { icon: Car, label: 'Complimentary Team Parking' },
    { icon: ShowerHead, label: 'Changing Rooms & Showers' },
    { icon: Volume2, label: 'Digital Scoreboard & PA System' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back button */}
      <button
        onClick={() => onNavigate('/grounds')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Grounds Listing</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Media & Ground Info (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ground Hero Image */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md h-72 sm:h-96">
            <img
              src={ground.imageUrl}
              alt={ground.groundName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

            <div className="absolute top-4 left-4">
              <StatusBadge status={ground.availability} size="md" />
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black drop-shadow-md">
                  {ground.groundName}
                </h1>
                <p className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-300 font-medium mt-1">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{ground.location}</span>
                </p>
              </div>

              <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl text-slate-900 border border-white/20 self-start sm:self-auto">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rate</div>
                <div className="text-xl font-black">
                  ₹{ground.hourlyPrice.toLocaleString('en-IN')}<span className="text-xs font-semibold text-slate-500"> / hr</span>
                </div>
              </div>
            </div>
          </div>

          {/* About Ground */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900">Ground Overview & Specifications</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {ground.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Opening Time</span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  {ground.openingTime}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Closing Time</span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  {ground.closingTime}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pitch Type</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">Natural Grass Turf</span>
              </div>
            </div>
          </div>

          {/* Amenities & Facility List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">Facilities & Match Amenities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {amenities.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs font-semibold text-slate-700">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Availability Checker (1 col) */}
        <div className="space-y-6">
          <AvailabilityChecker
            groundId={ground.groundId}
            openingTime={ground.openingTime}
            closingTime={ground.closingTime}
            hourlyPrice={ground.hourlyPrice}
            onSlotSelected={slotData => {
              // Pass slot data via query/navigation to booking page
              onNavigate(`/booking/${ground.groundId}?date=${slotData.date}&startTime=${slotData.startTime}&endTime=${slotData.endTime}`);
            }}
          />

          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Match Reservation Rules</h4>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>Bookings are confirmed immediately upon successful demo payment.</li>
              <li>Dual bookings during overlapping hours are blocked by server logic.</li>
              <li>Free cancellation available up to match commencement time.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
