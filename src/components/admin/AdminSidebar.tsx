import React from 'react';
import { LayoutDashboard, MapPin, CalendarDays, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentPath, onNavigate }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate('/');
  };

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Manage Grounds', path: '/admin/grounds', icon: MapPin },
    { label: 'Manage Bookings', path: '/admin/bookings', icon: CalendarDays },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 shrink-0 flex flex-col p-4 lg:p-6 lg:min-h-[calc(100vh-4rem)]">
      {/* Admin Profile Tag */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 mb-6">
        <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-950 truncate">{user?.name || 'Admin User'}</p>
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Super Administrator</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer text-left ${
                active
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="pt-4 border-t border-slate-100 mt-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin Portal</span>
        </button>
      </div>
    </aside>
  );
};
