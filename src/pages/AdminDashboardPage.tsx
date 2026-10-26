import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { AdminDashboardStats } from '../types';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminStatsCard } from '../components/admin/AdminStatsCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  MapPin,
  CheckCircle,
  CalendarDays,
  IndianRupee,
  Clock,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Users
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getDashboard();
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.message || 'Failed to retrieve administrative statistics.');
      }
    } catch {
      setError('Unable to load admin metrics from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <AdminSidebar currentPath="/admin/dashboard" onNavigate={onNavigate} />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              Admin Control Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
              System Overview & Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live operational metrics queried directly from the PostgreSQL relational database.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('/admin/grounds')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Add / Edit Grounds
            </button>
            <button
              onClick={() => onNavigate('/admin/bookings')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Manage Bookings
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Computing live system metrics from database..." fullPage />
        ) : error || !stats ? (
          <ErrorMessage message={error || 'Failed to load dashboard metrics.'} onRetry={fetchStats} />
        ) : (
          <>
            {/* Stat Cards Grid (Section 27) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AdminStatsCard
                title="Total Grounds"
                value={stats.totalGrounds}
                subtitle={`${stats.availableGrounds} active for booking`}
                icon={MapPin}
                variant="slate"
              />

              <AdminStatsCard
                title="Available Grounds"
                value={stats.availableGrounds}
                subtitle="Open for reservations"
                icon={CheckCircle}
                variant="emerald"
              />

              <AdminStatsCard
                title="Total Bookings"
                value={stats.totalBookings}
                subtitle="All-time match reservations"
                icon={CalendarDays}
                variant="blue"
              />

              <AdminStatsCard
                title="Confirmed Bookings"
                value={stats.confirmedBookings}
                subtitle="Paid & officially verified"
                icon={CheckCircle}
                variant="emerald"
              />

              <AdminStatsCard
                title="Pending Payments"
                value={stats.pendingPayments}
                subtitle="Awaiting user checkout"
                icon={Clock}
                variant="amber"
              />

              <AdminStatsCard
                title="Total Revenue"
                value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
                subtitle="Net confirmed payment ledger"
                icon={IndianRupee}
                variant="purple"
              />
            </div>

            {/* Visual Summaries & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ground Capacity & Occupancy Breakdown */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span>Ground Availability Ratio</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">Live DB</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Active Grounds</span>
                      <span className="text-emerald-700">
                        {stats.totalGrounds > 0
                          ? Math.round((stats.availableGrounds / stats.totalGrounds) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${stats.totalGrounds > 0 ? (stats.availableGrounds / stats.totalGrounds) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Confirmed Booking Conversion</span>
                      <span className="text-blue-700">
                        {stats.totalBookings > 0
                          ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${stats.totalBookings > 0 ? (stats.confirmedBookings / stats.totalBookings) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-900">UML System Integrity Notice</p>
                    <p>All stats are derived dynamically via SQL aggregation queries over the PostgreSQL tables.</p>
                  </div>
                </div>
              </div>

              {/* Recent Bookings Feed (2 cols) */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Recent Reservation Activity</span>
                  </h3>
                  <button
                    onClick={() => onNavigate('/admin/bookings')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {stats.recentBookings.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No bookings recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {stats.recentBookings.map(b => (
                      <div key={b.bookingId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-500">{b.bookingId}</span>
                            <StatusBadge status={b.bookingStatus} size="sm" />
                            <StatusBadge status={b.paymentStatus} size="sm" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">
                            {b.groundName}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Booked by <span className="font-semibold text-slate-700">{b.userName}</span> • {b.bookingDate} ({b.startTime} - {b.endTime})
                          </p>
                        </div>

                        <div className="text-right sm:self-center">
                          <span className="text-sm font-black text-slate-900 block">
                            ₹{b.amount?.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400">Calculated</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
