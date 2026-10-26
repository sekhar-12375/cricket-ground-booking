import React, { useState, useEffect } from 'react';
import { bookingsApi } from '../services/api';
import { Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  MapPin,
  Trophy,
  IndianRupee
} from 'lucide-react';

interface UserDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await bookingsApi.getMyBookings();
        if (res.success && res.data) {
          setBookings(res.data);
        }
      } catch (err) {
        console.error('Failed to load user dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingBookings = bookings.filter(b => b.bookingDate >= todayStr && b.bookingStatus === 'CONFIRMED');
  const confirmedCount = bookings.filter(b => b.bookingStatus === 'CONFIRMED').length;
  const totalSpent = bookings
    .filter(b => b.paymentStatus === 'SUCCESS')
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const nextMatch = upcomingBookings[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>Player Member Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name || 'Cricket Player'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
            Manage your scheduled pitch sessions, download entry vouchers, and reserve premier grounds.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/grounds')}
          className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Book A Ground</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{bookings.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Matches</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{upcomingBookings.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirmed</span>
            <div className="text-2xl font-black text-blue-700 mt-1">{confirmedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Amount Spent</span>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{totalSpent.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Two-column content: Next Match & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next Match Card (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Next Scheduled Match</h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              UPCOMING
            </span>
          </div>

          {nextMatch ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">{nextMatch.groundName}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {nextMatch.groundLocation}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-slate-800">{nextMatch.bookingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timing:</span>
                  <span className="font-bold text-slate-800">{nextMatch.startTime} – {nextMatch.endTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-emerald-700">₹{nextMatch.amount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate(`/confirmation/${nextMatch.bookingId}`)}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Entry Pass</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 space-y-3">
              <p>No upcoming matches booked.</p>
              <button
                onClick={() => onNavigate('/grounds')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Find A Ground
              </button>
            </div>
          )}
        </div>

        {/* Recent Bookings (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Recent Booking Activity</h3>
            <button
              onClick={() => onNavigate('/my-bookings')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading records..." />
          ) : bookings.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              You haven't made any bookings yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.slice(0, 4).map(b => (
                <div key={b.bookingId} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{b.groundName}</h4>
                    <p className="text-xs text-slate-500">
                      {b.bookingDate} • {b.startTime} - {b.endTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={b.bookingStatus} size="sm" />
                    <button
                      onClick={() => onNavigate(`/confirmation/${b.bookingId}`)}
                      className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                      title="Details"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
