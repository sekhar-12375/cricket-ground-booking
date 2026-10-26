import React from 'react';
import { Logo } from '../ui/Logo';
import { Shield, Award, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Logo size="md" className="[&_span]:text-white [&_span.text-emerald-600]:text-emerald-400" />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              The Cricket Ground Booking System is a web-based application designed to simplify cricket ground reservation. Users can securely log in, browse grounds, check date and time availability, create bookings, complete payment, and receive booking confirmation. Administrators can manage cricket grounds, update availability, and monitor bookings through a dedicated dashboard.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-emerald-400 border border-slate-700">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>B.Tech Software Engineering / UML Architecture Project</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/grounds')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Available Grounds
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/login')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  User Login
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/register')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  User Registration
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/admin/login')}
                  className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  Admin Login
                </button>
              </li>
            </ul>
          </div>

          {/* UML & System Highlights */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">System Architecture</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero Double-Booking Guarantee</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>PostgreSQL Persistent Relational DB</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Role-Based Access Control (RBAC)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Demo Payment Simulation Gateway</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Printable Formal Invoices</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Cricket Ground Booking System. B.Tech Computer Science & Engineering Project.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>UML Compliant</span>
            <span>•</span>
            <span>PostgreSQL Backed</span>
            <span>•</span>
            <span>Full-Stack TypeScript</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
