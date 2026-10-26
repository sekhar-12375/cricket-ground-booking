import React from 'react';
import { Booking, Payment } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { CheckCircle2, Printer, CalendarDays, ArrowLeft, ShieldCheck, MapPin, Clock, Users, Hash } from 'lucide-react';

interface ConfirmationCardProps {
  booking: Booking;
  payment?: Payment | null;
  onViewMyBookings: () => void;
  onBackHome: () => void;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  booking,
  payment,
  onViewMyBookings,
  onBackHome
}) => {
  const handlePrint = () => {
    window.print();
  };

  const [startH, startM] = (booking.startTime || '00:00').split(':').map(Number);
  const [endH, endM] = (booking.endTime || '00:00').split(':').map(Number);
  const durationHours = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Printable Area */}
      <div id="printable-booking-confirmation" className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
        {/* Success Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-800 p-8 text-center text-white relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest text-emerald-100 mb-2">
            Cricket Ground Booking System
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            BOOKING CONFIRMED
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 max-w-md mx-auto">
            Your match slot is locked and officially confirmed. Present this voucher at ground entrance.
          </p>
        </div>

        {/* Voucher Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Reference ID Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Booking Reference ID
              </span>
              <span className="font-mono text-base font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Hash className="w-4 h-4 text-emerald-600" />
                {booking.bookingId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={booking.bookingStatus} />
              <StatusBadge status={booking.paymentStatus} />
            </div>
          </div>

          {/* Booking & Ground Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Booked Ground</span>
              <p className="text-base font-bold text-slate-900">{booking.groundName || 'Cricket Ground'}</p>
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {booking.groundLocation || 'Match Venue'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Booked By (User)</span>
              <p className="text-base font-bold text-slate-900">{booking.userName || 'Registered User'}</p>
              <p className="text-xs text-slate-600">{booking.userPhone || booking.userEmail || 'Verified Member'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Timing</span>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                {booking.bookingDate}
              </p>
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {booking.startTime} – {booking.endTime} ({durationHours > 0 ? durationHours : 2} hrs)
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Match Roster</span>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                {booking.numberOfPlayers || 11} Players Expected
              </p>
              {booking.specialRequest && (
                <p className="text-xs text-slate-500 italic">Req: "{booking.specialRequest}"</p>
              )}
            </div>
          </div>

          {/* Payment & Invoice Breakdown */}
          <div className="border-t border-dashed border-slate-200 pt-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment & Transaction Summary</h4>
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-semibold text-slate-800">{payment?.paymentMethod || 'DEMO_GATEWAY'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transaction ID:</span>
                <span className="font-mono font-medium text-slate-800">{payment?.transactionId || 'TXN_DEMO_CONFIRMED'}</span>
              </div>
              {payment?.paidAt && (
                <div className="flex justify-between text-slate-600">
                  <span>Paid At:</span>
                  <span className="text-slate-800">{new Date(payment.paidAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-2 border-t border-emerald-200">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-700 text-lg">₹{booking.amount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Ground Rules & Safety Notice */}
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-4 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Strict turf guidelines apply: Proper rubber spike cricket shoes only. Standard overs ball allocation provided at pavilion control. Please report 15 minutes before reserved slot.
            </p>
          </div>
        </div>
      </div>

      {/* Buttons (Hidden on Print) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={onBackHome}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print / Download</span>
          </button>
          <button
            onClick={onViewMyBookings}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <CalendarDays className="w-4 h-4" />
            <span>View My Bookings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
