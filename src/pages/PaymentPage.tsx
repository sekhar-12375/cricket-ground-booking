import React, { useState, useEffect } from 'react';
import { bookingsApi, paymentsApi } from '../services/api';
import { Booking } from '../types';
import { useToast } from '../components/ui/Toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import {
  CreditCard,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  XCircle,
  Hash,
  AlertTriangle,
  Receipt
} from 'lucide-react';

interface PaymentPageProps {
  bookingId: string;
  onNavigate: (path: string) => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({ bookingId, onNavigate }) => {
  const { showToast } = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('DEMO_UPI');

  useEffect(() => {
    async function loadBooking() {
      setLoading(true);
      setError(null);
      try {
        const res = await bookingsApi.getBooking(bookingId);
        if (res.success && res.data) {
          setBooking(res.data);
          // If already confirmed, redirect directly to confirmation
          if (res.data.bookingStatus === 'CONFIRMED' && res.data.paymentStatus === 'SUCCESS') {
            onNavigate(`/confirmation/${bookingId}`);
          }
        } else {
          setError(res.message || 'Booking reservation could not be retrieved.');
        }
      } catch {
        setError('Failed to connect to billing server.');
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [bookingId]);

  const handleProcessPayment = async (simulateOutcome: 'SUCCESS' | 'FAILURE') => {
    setProcessing(true);
    setError(null);

    try {
      const res = await paymentsApi.verifyPayment({
        bookingId,
        simulateOutcome,
        paymentMethod: selectedMethod
      });

      if (res.success) {
        showToast('Payment successful! Booking confirmed.', 'success');
        onNavigate(`/confirmation/${bookingId}`);
      } else {
        setError(res.message || 'Payment processing failed. Please try again.');
        showToast('Payment failed. Please retry or choose another method.', 'error');
        // Refresh booking state
        const refreshed = await bookingsApi.getBooking(bookingId);
        if (refreshed.success && refreshed.data) {
          setBooking(refreshed.data);
        }
      }
    } catch {
      setError('Payment gateway network error. Transaction aborted.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this pending booking?')) return;
    try {
      const res = await bookingsApi.cancelBooking(bookingId);
      if (res.success) {
        showToast('Pending booking cancelled.', 'info');
        onNavigate('/my-bookings');
      }
    } catch {
      showToast('Failed to cancel booking.', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner label="Securing payment session..." fullPage />;
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <ErrorMessage message={error || 'Booking reservation not found.'} />
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

  const [sh, sm] = (booking.startTime || '00:00').split(':').map(Number);
  const [eh, em] = (booking.endTime || '00:00').split(':').map(Number);
  const duration = ((eh * 60 + em) - (sh * 60 + sm)) / 60;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Banner */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Step 4 of 5: Secure Checkout
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
          Complete Match Booking Payment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your reservation parameters and authorize payment through the demo gateway.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm">Payment Unsuccessful</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Main Checkout Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        {/* Invoice Summary */}
        <div className="p-6 sm:p-8 border-b border-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Booking ID</span>
              <p className="font-mono text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                <Hash className="w-4 h-4 text-emerald-600" />
                {booking.bookingId}
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              <span className="text-xs font-black text-emerald-800">DEMO GATEWAY ACTIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Ground</span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">{booking.groundName}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {booking.groundLocation}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Date & Slot</span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                {booking.bookingDate}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {booking.startTime} – {booking.endTime} ({duration} hrs)
              </span>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Match Duration:</span>
              <span className="font-semibold text-slate-800">{duration} hours</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Service Fee:</span>
              <span className="text-emerald-700 font-semibold">₹0 (Waived for Demo)</span>
            </div>
            <div className="flex justify-between items-center text-base font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Payable Amount:</span>
              <span className="text-2xl text-emerald-700">₹{booking.amount?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods Selection */}
        <div className="p-6 sm:p-8 space-y-6 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Payment Method (Simulation)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'DEMO_UPI', label: 'UPI / QR', desc: 'Instant UPI simulator' },
              { id: 'DEMO_CARD', label: 'Credit / Debit Card', desc: 'Mock test card' },
              { id: 'DEMO_NETBANKING', label: 'Net Banking', desc: 'Demo bank account' }
            ].map(method => (
              <label
                key={method.id}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedMethod === method.id
                    ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{method.label}</span>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedMethod === method.id}
                    onChange={() => setSelectedMethod(method.id)}
                    className="accent-emerald-600 cursor-pointer"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1">{method.desc}</span>
              </label>
            ))}
          </div>

          {/* Action Buttons as per specification: PAY NOW, CANCEL, and controlled demo failure */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleProcessPayment('SUCCESS')}
              disabled={processing}
              className="w-full py-4 px-6 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Payment via Gateway...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>PAY NOW (₹{booking.amount?.toLocaleString('en-IN')})</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleProcessPayment('FAILURE')}
                disabled={processing}
                className="py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                title="Test how system handles declined transaction"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Simulate Demo Failure</span>
              </button>

              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={processing}
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors text-center cursor-pointer disabled:opacity-60"
              >
                Cancel Booking
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Mock Gateway • Double-Booking Atomic Shield Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
