import React, { useState, useEffect } from 'react';
import { adminApi, groundsApi } from '../services/api';
import { Booking, Ground } from '../types';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useToast } from '../components/ui/Toast';
import {
  Search,
  Filter,
  Calendar,
  Eye,
  XCircle,
  Hash,
  Download,
  AlertCircle
} from 'lucide-react';

interface AdminBookingsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminBookingsPage: React.FC<AdminBookingsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [bookingStatus, setBookingStatus] = useState<string>('ALL');
  const [paymentStatus, setPaymentStatus] = useState<string>('ALL');
  const [groundId, setGroundId] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getBookings({
        search: search.trim() || undefined,
        bookingStatus: bookingStatus !== 'ALL' ? bookingStatus : undefined,
        paymentStatus: paymentStatus !== 'ALL' ? paymentStatus : undefined,
        groundId: groundId !== 'ALL' ? groundId : undefined,
        date: dateFilter.trim() || undefined
      });
      if (res.success && res.data) {
        setBookings(res.data);
      } else {
        setError(res.message || 'Failed to retrieve bookings.');
      }
    } catch {
      setError('Unable to load bookings from administrative endpoint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadFilterGrounds() {
      try {
        const gRes = await groundsApi.getGrounds();
        if (gRes.success && gRes.data) {
          setGrounds(gRes.data);
        }
      } catch (err) {
        console.error('Failed to load grounds for filter:', err);
      }
    }
    loadFilterGrounds();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [search, bookingStatus, paymentStatus, groundId, dateFilter]);

  const handleAdminCancel = async (bookingId: string) => {
    const confirmed = window.confirm(`Are you sure you want to cancel booking ${bookingId}? If paid, payment will be marked REFUNDED.`);
    if (!confirmed) return;

    try {
      const res = await adminApi.updateBookingStatus(bookingId, 'CANCELLED');
      if (res.success) {
        showToast('Booking cancelled by administrator.', 'success');
        await fetchBookings();
      } else {
        showToast(res.message || 'Failed to cancel booking.', 'error');
      }
    } catch {
      showToast('Error processing cancellation.', 'error');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <AdminSidebar currentPath="/admin/bookings" onNavigate={onNavigate} />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            Booking Supervision
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            Manage Match Reservations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter, inspect user details, audit payment ledger statuses, and manage bookings.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Search Booking / User / Ground
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ID, customer name, ground..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Booking Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Booking Status
              </label>
              <select
                value={bookingStatus}
                onChange={e => setBookingStatus(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Payments</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            {/* Ground Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Ground Filter
              </label>
              <select
                value={groundId}
                onChange={e => setGroundId(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500 cursor-pointer truncate"
              >
                <option value="ALL">All Cricket Grounds</option>
                {grounds.map(g => (
                  <option key={g.groundId} value={g.groundId}>
                    {g.groundName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <LoadingSpinner label="Loading bookings data from database..." fullPage />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchBookings} />
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
            No bookings found matching current filter specifications.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Booking ID</th>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Ground</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Booking Status</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map(b => (
                    <tr key={b.bookingId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-500">{b.bookingId}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{b.userName || 'User'}</div>
                        <div className="text-[11px] text-slate-500">{b.userEmail || b.userPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{b.groundName}</div>
                        <div className="text-[11px] text-slate-500">{b.groundLocation}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-semibold">{b.bookingDate}</div>
                        <div className="text-[11px] text-slate-500">{b.startTime} – {b.endTime}</div>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        ₹{b.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.bookingStatus} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.paymentStatus} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onNavigate(`/confirmation/${b.bookingId}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                            title="View Voucher"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {b.bookingStatus !== 'CANCELLED' && (
                            <button
                              onClick={() => handleAdminCancel(b.bookingId)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Cancel Booking"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
