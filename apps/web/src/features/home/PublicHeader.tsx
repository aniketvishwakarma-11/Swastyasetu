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
} from 'lucide-react';

export const PublicHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const dashboardRoute = user ? getDefaultDashboard(user.role) : '/phc';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-2.5 group cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm transition-colors group-hover:bg-teal-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-slate-900">SwasthyaSetu</span>
            <span className="hidden sm:inline ml-2 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5">
              Continuity Layer
            </span>
          </div>
        </Link>

        {/* Section links (desktop) */}
        <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold text-slate-600" aria-label="Page sections">
          <a
            href="#how-it-works"
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:text-teal-700 transition-colors cursor-pointer"
          >
            How it Works
          </a>
          <a
            href="#capabilities"
            onClick={(e) => scrollToSection(e, 'capabilities')}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:text-teal-700 transition-colors cursor-pointer"
          >
            Capabilities
          </a>
          <a
            href="#roles"
            onClick={(e) => scrollToSection(e, 'roles')}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:text-teal-700 transition-colors cursor-pointer"
          >
            Roles
          </a>
        </nav>

        {/* Auth / Dashboard CTAs & Mobile Hamburger */}
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              <Link
                to={dashboardRoute}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                title="Log out of session"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center space-x-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-teal-300 hover:bg-slate-50 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Log In</span>
              </Link>
              <Link
                to="/signup"
                className="flex items-center space-x-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Create Staff Account</span>
                <span className="sm:hidden">Register</span>
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 shadow-lg">
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
              Roles
            </a>
          </nav>
          <div className="pt-2 border-t border-slate-100 flex flex-col space-y-1.5">
            {user ? (
              <>
                <Link
                  to={dashboardRoute}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
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
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Log In</span>
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
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
