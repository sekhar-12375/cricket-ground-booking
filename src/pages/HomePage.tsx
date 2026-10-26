import React, { useEffect, useState } from 'react';
import { groundsApi } from '../services/api';
import { Ground } from '../types';
import { GroundCard } from '../components/grounds/GroundCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import {
  CalendarCheck,
  ShieldCheck,
  CreditCard,
  FileCheck2,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Trophy,
  Users,
  Compass
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [featuredGrounds, setFeaturedGrounds] = useState<Ground[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadGrounds() {
      try {
        const res = await groundsApi.getGrounds();
        if (res.success && res.data) {
          setFeaturedGrounds(res.data.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load featured grounds:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGrounds();
  }, []);

  const howItWorksSteps = [
    { num: '01', title: 'Login / Register', desc: 'Sign into your verified user account or register with one click.' },
    { num: '02', title: 'Select Ground', desc: 'Browse tournament-grade cricket arenas across multiple locations.' },
    { num: '03', title: 'Check Availability', desc: 'Real-time database validation ensures zero double-booking overlap.' },
    { num: '04', title: 'Book & Pay', desc: 'Select match hours, review pricing, and simulate instant demo payment.' },
    { num: '05', title: 'Get Confirmation', desc: 'Receive your official confirmed booking voucher and print receipt.' }
  ];

  const features = [
    {
      icon: CalendarCheck,
      title: 'Easy Booking',
      desc: 'Intuitive interface designed to schedule league matches, box cricket, and club tournaments in seconds.'
    },
    {
      icon: ShieldCheck,
      title: 'Availability Checking',
      desc: 'Server-side conflict detection eliminates overlapping bookings through atomic database queries.'
    },
    {
      icon: CreditCard,
      title: 'Secure Payment',
      desc: 'Reliable payment gateway simulation with instant ledger verification and transaction safety.'
    },
    {
      icon: FileCheck2,
      title: 'Booking Confirmation',
      desc: 'Official booking pass with unique ID, turf rules, player rosters, and printable receipt download.'
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        {/* Background glow and subtle sports pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl transform -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-3xl transform translate-y-1/2" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide uppercase">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>Cricket Ground Booking System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight sm:leading-none">
            Book Your Cricket Ground <span className="text-emerald-400">Easily</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            Find available cricket grounds, choose your preferred date and time, and confirm your booking securely.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => onNavigate('/grounds')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Browse Grounds</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!user ? (
              <button
                onClick={() => onNavigate('/login')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700 transition-colors cursor-pointer"
              >
                Login to Book
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700 transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
            )}
          </div>

          {/* Key Quick Stats */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-slate-800/80 text-left">
            <div className="p-3">
              <div className="text-2xl font-black text-white">100%</div>
              <div className="text-xs text-slate-400">Turf Authenticity</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-emerald-400">0 Overlap</div>
              <div className="text-xs text-slate-400">Zero Double Booking</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-white">Day & Night</div>
              <div className="text-xs text-slate-400">LED Floodlit Arenas</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-emerald-400">Instant</div>
              <div className="text-xs text-slate-400">Voucher Generation</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Simple 5-Step Flow
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
            How It Works
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            The streamlined UML activity flow from registration to confirmed match day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {howItWorksSteps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-2xl font-black text-emerald-600 font-mono block mb-3">
                  {step.num}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED GROUNDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Top Rated Arenas
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              Featured Grounds
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Popular match grounds with tournament turf pitches and floodlight facilities.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/grounds')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            <span>View All Grounds</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading featured grounds..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredGrounds.map(ground => (
              <GroundCard
                key={ground.groundId}
                ground={ground}
                onViewDetails={id => onNavigate(`/grounds/${id}`)}
                onBookNow={id => onNavigate(`/booking/${id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. FEATURES */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 rounded-3xl max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
            Core Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-3">
            Engineered For Seamless Bookings
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Every feature is backed by real transactional server checks and persistent relational database storage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-6 space-y-3.5 hover:border-emerald-500/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-emerald-50 to-green-100/60 rounded-3xl border border-emerald-200/80 p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-xs">
                Quality Assurance
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Why Teams Choose CricketBook
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Whether you are hosting a weekend friendly, collegiate tournament, or club league match, our platform guarantees effortless coordination and verified turf readiness.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Zero Double-Booking Guarantee</h4>
                    <p className="text-xs text-slate-600">Atomic database constraints prevent duplicate slot assignment.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Transparent Hourly Pricing</h4>
                    <p className="text-xs text-slate-600">Calculated dynamically based on slot duration with zero hidden charges.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Instant Voucher Generation</h4>
                    <p className="text-xs text-slate-600">Download or print full match admission passes with team details.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => onNavigate('/grounds')}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                >
                  Explore Grounds Now
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80"
                  alt="Cricket Stadium Pitch"
                  className="w-full h-80 object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl border border-slate-200 shadow-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Tournament Ready</div>
                  <div className="text-[11px] text-slate-500">Pavilion, Umpires & Lights</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
