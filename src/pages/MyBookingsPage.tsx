import React, { useState, useEffect } from 'react';
import { bookingsApi } from '../services/api';
import { Booking } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useToast } from '../components/ui/Toast';
import {
  Calendar,
  Clock,
  MapPin,
  Eye,
  XCircle,
  CreditCard,
  Hash
} from 'lucide-react';

interface MyBookingsPageProps {
  onNavigate: (path: string) => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'CANCELLED'>('UPCOMING');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.getMyBookings();
      if (res.success && res.data) {
        setBookings(res.data);
      } else {
        setError(res.message || 'Failed to retrieve your bookings.');
      }
    } catch {
      setError('Unable to reach bookings service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: string) => {
    const confirmed = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirmed) return;

    setActionId(bookingId);
    try {
      const res = await bookingsApi.cancelBooking(bookingId);
      if (res.success) {
        showToast('Booking cancelled successfully. Any payment has been marked refunded.', 'success');
        await fetchBookings();
      } else {
        showToast(res.message || 'Could not cancel booking.', 'error');
      }
    } catch {
      showToast('Error cancelling booking.', 'error');
    } finally {
      setActionId(null);
    }
  };

  // Categorize bookings
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'CANCELLED') {
      return b.bookingStatus === 'CANCELLED';
    }
    if (activeTab === 'PAST') {
      return (
        b.bookingStatus === 'COMPLETED' ||
        (b.bookingStatus !== 'CANCELLED' && b.bookingDate < todayStr)
      );
    }
    // UPCOMING:
    return (
      (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING_PAYMENT') &&
      b.bookingDate >= todayStr
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            User Reservations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            My Cricket Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track upcoming matches, view past history, and manage vouchers.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/grounds')}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          Book Another Ground
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        {(['UPCOMING', 'PAST', 'CANCELLED'] as const).map(tab => {
          const active = activeTab === tab;
          const count = bookings.filter(b => {
            if (tab === 'CANCELLED') return b.bookingStatus === 'CANCELLED';
            if (tab === 'PAST') return b.bookingStatus === 'COMPLETED' || (b.bookingStatus !== 'CANCELLED' && b.bookingDate < todayStr);
            return (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING_PAYMENT') && b.bookingDate >= todayStr;
          }).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                active
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab === 'UPCOMING' ? 'Upcoming Matches' : tab === 'PAST' ? 'Past Matches' : 'Cancelled'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bookings List */}
      {loading ? (
        <LoadingSpinner label="Loading your reservations..." fullPage />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchBookings} />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title={`No ${activeTab.toLowerCase()} bookings found`}
          description={
            activeTab === 'UPCOMING'
              ? "You don't have any upcoming cricket matches reserved right now."
              : `No bookings found in the ${activeTab.toLowerCase()} category.`
          }
          actionText={activeTab === 'UPCOMING' ? 'Explore Grounds' : undefined}
          onAction={activeTab === 'UPCOMING' ? () => onNavigate('/grounds') : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(b => {
            const isConfirmed = b.bookingStatus === 'CONFIRMED';
            const isPendingPayment = b.bookingStatus === 'PENDING_PAYMENT';
            const canCancel = (isConfirmed || isPendingPayment) && b.bookingDate >= todayStr;

            return (
              <div
                key={b.bookingId}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left Ground & Date Info */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Hash className="w-3 h-3 text-emerald-600" />
                      {b.bookingId}
                    </span>
                    <StatusBadge status={b.bookingStatus} size="sm" />
                    <StatusBadge status={b.paymentStatus} size="sm" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {b.groundName || 'Cricket Ground'}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {b.groundLocation}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      {b.bookingDate}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {b.startTime} – {b.endTime}
                    </span>
                    <span className="font-bold text-slate-900">
                      ₹{b.amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  {/* If pending payment, show complete payment button */}
                  {isPendingPayment && (
                    <button
                      onClick={() => onNavigate(`/payment/${b.bookingId}`)}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Now</span>
                    </button>
                  )}

                  {/* If confirmed, view voucher */}
                  {isConfirmed && (
                    <button
                      onClick={() => onNavigate(`/confirmation/${b.bookingId}`)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Voucher</span>
                    </button>
                  )}

                  {/* Cancel Booking where valid */}
                  {canCancel && (
                    <button
                      onClick={() => handleCancel(b.bookingId)}
                      disabled={actionId === b.bookingId}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
