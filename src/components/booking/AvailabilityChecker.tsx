import React, { useState } from 'react';
import { groundsApi } from '../../services/api';
import { AvailabilityResult } from '../../types';
import { Calendar, Clock, CheckCircle2, XCircle, ArrowRight, AlertTriangle } from 'lucide-react';

interface AvailabilityCheckerProps {
  groundId: string;
  openingTime: string;
  closingTime: string;
  hourlyPrice: number;
  onSlotSelected?: (data: { date: string; startTime: string; endTime: string; duration: number; amount: number }) => void;
}

export const AvailabilityChecker: React.FC<AvailabilityCheckerProps> = ({
  groundId,
  openingTime,
  closingTime,
  hourlyPrice,
  onSlotSelected
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(todayStr);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsChecking(true);
    setResult(null);

    try {
      const res = await groundsApi.checkAvailability(groundId, date, startTime, endTime);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.message || 'Failed to verify slot availability.');
      }
    } catch {
      setError('Unable to reach server to check availability.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleProceed = () => {
    if (result && result.isAvailable && onSlotSelected) {
      onSlotSelected({
        date: result.requestedDate,
        startTime: result.requestedStart,
        endTime: result.requestedEnd,
        duration: result.durationHours,
        amount: result.totalAmount
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Check Slot Availability</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Operating Hours: {openingTime} – {closingTime}
          </p>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          ₹{hourlyPrice}/hr
        </span>
      </div>

      <form onSubmit={handleCheck} className="mt-5 space-y-4">
        {/* Date Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Select Match Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              min={todayStr}
              value={date}
              onChange={e => {
                setDate(e.target.value);
                setResult(null);
              }}
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            />
          </div>
        </div>

        {/* Time Slots */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Start Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="time"
                value={startTime}
                onChange={e => {
                  setStartTime(e.target.value);
                  setResult(null);
                }}
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              End Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="time"
                value={endTime}
                onChange={e => {
                  setEndTime(e.target.value);
                  setResult(null);
                }}
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isChecking}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isChecking ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Checking Availability...</span>
            </>
          ) : (
            <span>Check Availability</span>
          )}
        </button>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Availability Result Display */}
      {result && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in">
          {result.isAvailable ? (
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>AVAILABLE</span>
              </div>
              <div className="text-xs space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-semibold">{result.durationHours} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Calculated Rate:</span>
                  <span className="font-semibold">₹{result.hourlyPrice} × {result.durationHours} hr</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-emerald-200/60">
                  <span>Total Amount:</span>
                  <span className="text-emerald-700">₹{result.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {onSlotSelected && (
                <button
                  type="button"
                  onClick={handleProceed}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Book This Slot</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>GROUND UNAVAILABLE</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                {result.message}
              </p>
              {result.conflictingBookings && result.conflictingBookings.length > 0 && (
                <div className="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-lg border border-rose-100">
                  <span className="font-semibold text-rose-900">Reserved Slot(s): </span>
                  {result.conflictingBookings.map((b, idx) => (
                    <span key={idx} className="font-medium text-slate-700">
                      {b.startTime} - {b.endTime}
                      {idx < result.conflictingBookings!.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-slate-500 italic">
                Please select an alternate time or date above and check again.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
