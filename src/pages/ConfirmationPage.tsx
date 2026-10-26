import React, { useEffect, useState } from 'react';
import { bookingsApi } from '../services/api';
import { Booking, Payment } from '../types';
import { ConfirmationCard } from '../components/booking/ConfirmationCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { ArrowLeft } from 'lucide-react';

interface ConfirmationPageProps {
  bookingId: string;
  onNavigate: (path: string) => void;
}

export const ConfirmationPage: React.FC<ConfirmationPageProps> = ({ bookingId, onNavigate }) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfirmedBooking() {
      setLoading(true);
      setError(null);
      try {
        const res = await bookingsApi.getBooking(bookingId);
        if (res.success && res.data) {
          setBooking(res.data);
          if (res.data.payment) {
            setPayment(res.data.payment);
          }
        } else {
          setError(res.message || 'Confirmation details could not be retrieved.');
        }
      } catch {
        setError('Failed to contact server to retrieve confirmed booking.');
      } finally {
        setLoading(false);
      }
    }
    loadConfirmedBooking();
  }, [bookingId]);

  if (loading) {
    return <LoadingSpinner label="Generating official match voucher..." fullPage />;
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <ErrorMessage message={error || 'Booking voucher not found.'} />
        <button
          onClick={() => onNavigate('/')}
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Home</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ConfirmationCard
        booking={booking}
        payment={payment}
        onViewMyBookings={() => onNavigate('/my-bookings')}
        onBackHome={() => onNavigate('/')}
      />
    </div>
  );
};
