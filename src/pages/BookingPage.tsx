import React, { useState, useEffect } from 'react';
import { groundsApi, bookingsApi } from '../services/api';
import { Ground } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  ArrowLeft,
  CreditCard,
  AlertTriangle,
  Receipt
} from 'lucide-react';

interface BookingPageProps {
  groundId: string;
  onNavigate: (path: string) => void;
  queryParams?: Record<string, string>;
}

export const BookingPage: React.FC<BookingPageProps> = ({ groundId, onNavigate, queryParams = {} }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [ground, setGround] = useState<Ground | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State initialized with query params or defaults
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState<string>(queryParams.date || todayStr);
  const [startTime, setStartTime] = useState<string>(queryParams.startTime || '08:00');
  const [endTime, setEndTime] = useState<string>(queryParams.endTime || '10:00');
  const [numberOfPlayers, setNumberOfPlayers] = useState<number>(11);
  const [specialRequest, setSpecialRequest] = useState<string>('');

  useEffect(() => {
    async function loadGround() {
      setLoading(true);
      setError(null);
      try {
        const res = await groundsApi.getGround(groundId);
        if (res.success && res.data) {
          setGround(res.data);
        } else {
          setError(res.message || 'Ground not found.');
        }
      } catch {
        setError('Failed to fetch ground details.');
      } finally {
        setLoading(false);
      }
    }
    loadGround();
  }, [groundId]);

  // Duration & Total Calculation
  const calculateDuration = () => {
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
      return diffMinutes > 0 ? diffMinutes / 60 : 0;
    } catch {
      return 0;
    }
  };

  const durationHours = calculateDuration();
  const hourlyPrice = ground ? ground.hourlyPrice : 0;
  const totalAmount = hourlyPrice * durationHours;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in to proceed with your booking.', 'error');
      onNavigate(`/login?redirect=/booking/${groundId}`);
      return;
    }

    if (durationHours <= 0) {
      setError('End time must be after start time.');
      return;
    }

    if (ground && (startTime < ground.openingTime || endTime > ground.closingTime)) {
      setError(`Selected match times must be within ground operating hours (${ground.openingTime} - ${ground.closingTime}).`);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await bookingsApi.createBooking({
        groundId,
        bookingDate,
        startTime,
        endTime,
        numberOfPlayers,
        specialRequest
      });

      if (res.success && res.data) {
        showToast('Booking details saved. Redirecting to payment...', 'success');
        onNavigate(`/payment/${res.data.bookingId}`);
      } else {
        setError(res.message || 'Slot is unavailable for booking or overlaps with existing reservation.');
      }
    } catch {
      setError('An error occurred while creating your booking reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading booking details..." fullPage />;
  }

  if (!ground) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <ErrorMessage message={error || 'Ground not found.'} />
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back button */}
      <button
        onClick={() => onNavigate(`/grounds/${groundId}`)}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Ground Details</span>
      </button>

      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Match Reservation Form
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
          Reserve {ground.groundName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide your team details and desired match slot to lock the turf.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ground (Read-only summary) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Selected Ground
              </label>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{ground.groundName}</h4>
                  <p className="text-xs text-slate-500">{ground.location} • {ground.openingTime} – {ground.closingTime}</p>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                  ₹{ground.hourlyPrice}/hr
                </span>
              </div>
            </div>

            {/* Booking Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Match Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  min={todayStr}
                  value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white cursor-pointer"
                />
              </div>
            </div>

            {/* Start and End Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Start Time <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  End Time <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Number of Players */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expected Players Count
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="number"
                  min={2}
                  max={40}
                  value={numberOfPlayers}
                  onChange={e => setNumberOfPlayers(Math.max(2, parseInt(e.target.value) || 11))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Typical 11 vs 11 match involves 22 players plus substitutes.</p>
            </div>

            {/* Special Request */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Special Requests or Turf Instructions
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <textarea
                  rows={3}
                  value={specialRequest}
                  onChange={e => setSpecialRequest(e.target.value)}
                  placeholder="e.g. Leather balls, match umpires, floodlights after 6 PM..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || durationHours <= 0}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Reserving Slot...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Proceed to Payment (₹{totalAmount.toLocaleString('en-IN')})</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right 1 Col: Dynamic Price Breakdown Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span>Booking Summary</span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-semibold text-slate-800">{bookingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Slot:</span>
                <span className="font-semibold text-slate-800">{startTime} – {endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-semibold text-slate-800">{durationHours} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hourly Rate:</span>
                <span className="font-semibold text-slate-800">₹{hourlyPrice} / hr</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Amount:</span>
                <span className="text-xl text-emerald-700">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed">
              <strong>Price Calculation Rule:</strong> Total amount = Hourly Price × Duration ({hourlyPrice} × {durationHours} hr). Verified securely on backend server before payment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
