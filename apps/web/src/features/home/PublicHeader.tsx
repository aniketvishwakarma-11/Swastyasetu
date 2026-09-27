import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, getDefaultDashboard } from '../../context/AuthContext';
import {
  Activity,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Radio,
} from 'lucide-react';

export const PublicHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const dashboardRoute = user ? getDefaultDashboard(user.role) : '/phc';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group cursor-pointer">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-sm shadow-teal-700/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
            <Activity className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold tracking-tight text-slate-900 font-display">
                SwasthyaSetu
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200/80 rounded-full px-2.5 py-0.5">
                <Radio className="w-2.5 h-2.5 text-teal-600 animate-pulse" />
                Continuity Layer
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              Offline-First Emergency Healthcare Network
            </p>
          </div>
        </Link>

        {/* Section links (desktop) */}
        <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold text-slate-600" aria-label="Page sections">
          <a
            href="#how-it-works"
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            className="px-3.5 py-2 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100/70 transition-all duration-200 cursor-pointer font-medium"
          >
            How it Works
          </a>
          <a
            href="#capabilities"
            onClick={(e) => scrollToSection(e, 'capabilities')}
            className="px-3.5 py-2 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100/70 transition-all duration-200 cursor-pointer font-medium"
          >
            Capabilities
          </a>
          <a
            href="#roles"
            onClick={(e) => scrollToSection(e, 'roles')}
            className="px-3.5 py-2 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100/70 transition-all duration-200 cursor-pointer font-medium"
          >
            Clinical Roles
          </a>
        </nav>

        {/* Auth / Dashboard CTAs & Mobile Hamburger */}
        <div className="flex items-center space-x-2.5">
          {user ? (
            <>
              <Link
                to={dashboardRoute}
                className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all duration-200 shadow-sm shadow-teal-600/20 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200/90 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                title="Log out of session"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center space-x-1.5 rounded-xl border border-slate-200/90 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-800 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Log In</span>
              </Link>
              <Link
                to="/signup"
                className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-teal-700/20 transition-all duration-200 hover:from-teal-700 hover:to-teal-800 hover:shadow-md cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Staff Access</span>
                <span className="sm:hidden">Join</span>
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white px-4 py-3 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1 text-xs font-medium text-slate-600">
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-teal-700 transition-colors"
            >
              How it Works
            </a>
            <a
              href="#capabilities"
              onClick={(e) => scrollToSection(e, 'capabilities')}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-teal-700 transition-colors"
            >
              Capabilities
            </a>
            <a
              href="#roles"
              onClick={(e) => scrollToSection(e, 'roles')}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-teal-700 transition-colors"
            >
              Clinical Roles
            </a>
          </nav>
          <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
            {user ? (
              <>
                <Link
                  to={dashboardRoute}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Log In</span>
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Create Staff Account</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
