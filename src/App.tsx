import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Navbar } from './components/navbar/Navbar';
import { Footer } from './components/footer/Footer';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Pages
import { HomePage } from './pages/HomePage';
import { GroundsPage } from './pages/GroundsPage';
import { GroundDetailsPage } from './pages/GroundDetailsPage';
import { BookingPage } from './pages/BookingPage';
import { PaymentPage } from './pages/PaymentPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminGroundsPage } from './pages/AdminGroundsPage';
import { AdminBookingsPage } from './pages/AdminBookingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function RouterShell() {
  const { user, role, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  // Sync route from URL
  const parseCurrentLocation = () => {
    const path = window.location.pathname || '/';
    const search = window.location.search;
    const params: Record<string, string> = {};
    if (search) {
      const urlParams = new URLSearchParams(search);
      urlParams.forEach((val, key) => {
        params[key] = val;
      });
    }
    setCurrentPath(path);
    setQueryParams(params);
  };

  useEffect(() => {
    parseCurrentLocation();
    const handlePopState = () => parseCurrentLocation();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (fullPath: string) => {
    const [path, search] = fullPath.split('?');
    const newSearch = search ? `?${search}` : '';
    window.history.pushState({}, '', path + newSearch);
    parseCurrentLocation();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return <LoadingSpinner label="Initializing CricketBook system..." fullPage />;
  }

  // Route Dispatcher
  const renderCurrentPage = () => {
    // Public routes
    if (currentPath === '/' || currentPath === '') {
      return <HomePage onNavigate={navigate} />;
    }
    if (currentPath === '/grounds') {
      return <GroundsPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/grounds/')) {
      const groundId = currentPath.split('/')[2];
      if (groundId) {
        return <GroundDetailsPage groundId={groundId} onNavigate={navigate} />;
      }
    }

    // Auth routes
    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} queryParams={queryParams} />;
    }
    if (currentPath === '/register') {
      return <RegisterPage onNavigate={navigate} />;
    }
    if (currentPath === '/admin/login') {
      return <AdminLoginPage onNavigate={navigate} />;
    }

    // Confirmation route (accessible after payment or with bookingId)
    if (currentPath.startsWith('/confirmation/')) {
      const bookingId = currentPath.split('/')[2];
      if (bookingId) {
        return <ConfirmationPage bookingId={bookingId} onNavigate={navigate} />;
      }
    }

    // User Protected Routes
    if (
      currentPath === '/dashboard' ||
      currentPath.startsWith('/booking/') ||
      currentPath.startsWith('/payment/') ||
      currentPath === '/my-bookings' ||
      currentPath === '/profile'
    ) {
      if (!user) {
        return (
          <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900">User Login Required</h2>
            <p className="text-xs text-slate-500">Please sign in to access your dashboard, create bookings, or make payments.</p>
            <button
              onClick={() => navigate(`/login?redirect=${encodeURIComponent(currentPath)}`)}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Sign In Now
            </button>
          </div>
        );
      }

      if (currentPath === '/dashboard') {
        return <UserDashboardPage onNavigate={navigate} />;
      }
      if (currentPath.startsWith('/booking/')) {
        const groundId = currentPath.split('/')[2];
        return <BookingPage groundId={groundId} onNavigate={navigate} queryParams={queryParams} />;
      }
      if (currentPath.startsWith('/payment/')) {
        const bookingId = currentPath.split('/')[2];
        return <PaymentPage bookingId={bookingId} onNavigate={navigate} />;
      }
      if (currentPath === '/my-bookings') {
        return <MyBookingsPage onNavigate={navigate} />;
      }
      if (currentPath === '/profile') {
        return <ProfilePage onNavigate={navigate} />;
      }
    }

    // Admin Protected Routes
    if (currentPath.startsWith('/admin/')) {
      if (!user || role !== 'ADMIN') {
        return (
          <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
            <h2 className="text-xl font-bold text-amber-900">Admin Authorization Required</h2>
            <p className="text-xs text-slate-500">You must be logged in with administrative credentials to view this page.</p>
            <button
              onClick={() => navigate('/admin/login')}
              className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Go to Admin Login
            </button>
          </div>
        );
      }

      if (currentPath === '/admin/dashboard') {
        return <AdminDashboardPage onNavigate={navigate} />;
      }
      if (currentPath === '/admin/grounds' || currentPath.startsWith('/admin/grounds/')) {
        return <AdminGroundsPage onNavigate={navigate} />;
      }
      if (currentPath === '/admin/bookings' || currentPath.startsWith('/admin/bookings/')) {
        return <AdminBookingsPage onNavigate={navigate} />;
      }
    }

    return <NotFoundPage onNavigate={navigate} />;
  };

  const isAdminView = currentPath.startsWith('/admin') && role === 'ADMIN';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar currentPath={currentPath} onNavigate={navigate} />
      <div className="flex-1">
        {renderCurrentPage()}
      </div>
      {!isAdminView && <Footer onNavigate={navigate} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterShell />
        <Analytics />
      </ToastProvider>
    </AuthProvider>
  );
}
