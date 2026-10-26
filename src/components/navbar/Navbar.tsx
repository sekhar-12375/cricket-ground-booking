import React, { useState } from 'react';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  CalendarDays,
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    onNavigate('/');
    setMobileMenuOpen(false);
  };

  const navigateTo = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => currentPath === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button
            onClick={() => navigateTo('/')}
            className="flex items-center text-left focus:outline-hidden cursor-pointer"
          >
            <Logo size="md" />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {role !== 'ADMIN' && (
              <>
                <button
                  onClick={() => navigateTo('/')}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    isActive('/')
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => navigateTo('/grounds')}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    isActive('/grounds')
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Grounds
                </button>
              </>
            )}

            {/* Authenticated User Links */}
            {role === 'USER' && (
              <>
                <button
                  onClick={() => navigateTo('/my-bookings')}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    isActive('/my-bookings')
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Bookings
                </button>
                <button
                  onClick={() => navigateTo('/dashboard')}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    isActive('/dashboard')
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </button>
              </>
            )}

            {/* Authenticated Admin Links */}
            {role === 'ADMIN' && (
              <>
                <button
                  onClick={() => navigateTo('/admin/dashboard')}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    isActive('/admin/dashboard')
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigateTo('/admin/grounds')}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    isActive('/admin/grounds')
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Manage Grounds
                </button>
                <button
                  onClick={() => navigateTo('/admin/bookings')}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    isActive('/admin/bookings')
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Manage Bookings
                </button>
              </>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                {role === 'ADMIN' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    Admin
                  </span>
                ) : (
                  <button
                    onClick={() => navigateTo('/profile')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{user.name.split(' ')[0]}</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo('/login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => navigateTo('/register')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Register
                </button>
                <button
                  onClick={() => navigateTo('/admin/login')}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Admin Portal"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {role !== 'ADMIN' && (
            <>
              <button
                onClick={() => navigateTo('/')}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={() => navigateTo('/grounds')}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Available Grounds
              </button>
            </>
          )}

          {role === 'USER' && (
            <>
              <button
                onClick={() => navigateTo('/my-bookings')}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
              >
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                My Bookings
              </button>
              <button
                onClick={() => navigateTo('/dashboard')}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                User Dashboard
              </button>
              <button
                onClick={() => navigateTo('/profile')}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4 text-slate-500" />
                Profile
              </button>
            </>
          )}

          {role === 'ADMIN' && (
            <>
              <button
                onClick={() => navigateTo('/admin/dashboard')}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-600" />
                Admin Dashboard
              </button>
              <button
                onClick={() => navigateTo('/admin/grounds')}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Manage Grounds
              </button>
              <button
                onClick={() => navigateTo('/admin/bookings')}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Manage Bookings
              </button>
            </>
          )}

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout ({user.email})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigateTo('/login')}
                  className="px-4 py-2.5 text-center text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => navigateTo('/register')}
                  className="px-4 py-2.5 text-center text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  Register
                </button>
                <button
                  onClick={() => navigateTo('/admin/login')}
                  className="col-span-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 py-1.5 cursor-pointer"
                >
                  Admin Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
