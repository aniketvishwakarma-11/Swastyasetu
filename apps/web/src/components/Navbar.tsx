import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Wifi,
  WifiOff,
  Building2,
  Search,
  Bell,
  LogOut,
  Stethoscope,
  Building,
  Network,
  Download,
} from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(() => {
    try {
      return localStorage.getItem('swasthya_simulated_offline') === 'true';
    } catch {
      return false;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSimulatedOffline = (offline: boolean) => {
    setSimulatedOffline(offline);
    try {
      if (offline) {
        localStorage.setItem('swasthya_simulated_offline', 'true');
      } else {
        localStorage.removeItem('swasthya_simulated_offline');
      }
    } catch {}
    window.dispatchEvent(new CustomEvent('swasthya:connectivity-change', { detail: { isOnline: !offline } }));
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activeOnline = isOnline && !simulatedOffline;

  // Render unauthenticated topbar for /login and /signup
  if (!user) {
    return (
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3.5 backdrop-blur sm:px-6">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 font-bold text-white shadow-sm shadow-teal-600/20 transition-colors group-hover:bg-teal-700">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-bold text-slate-900 leading-tight">SwasthyaSetu</span>
              <span className="text-[10px] font-semibold text-teal-700 px-1.5 py-0.2 bg-teal-50 border border-teal-200 rounded">
                Continuity Layer
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Rural Healthcare Exchange</span>
          </div>
        </Link>

        <div className="flex items-center space-x-2">
          {!isInstalled && (isInstallable || isIOS) && (
            <button
              onClick={installApp}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl transition-colors cursor-pointer"
              title="Install SwasthyaSetu as an offline mobile app"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}
          <Link
            to="/login"
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-4 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition-colors"
          >
            Register
          </Link>
        </div>
      </header>
    );
  }

  // Render authenticated topbar with navigation & action controls
  return (
    <header className="sticky top-0 z-30 flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 py-2.5 backdrop-blur sm:px-6">
      {/* Left: Branding & Portal Tabs */}
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 font-bold text-white shadow-sm shadow-teal-600/20 transition-colors group-hover:bg-teal-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-bold text-slate-900 leading-tight">SwasthyaSetu</span>
              <span className="text-[9px] font-bold text-teal-700 px-1.5 py-0.5 bg-teal-50 border border-teal-200 rounded uppercase">
                {user.role}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Rural Healthcare Exchange</span>
          </div>
        </Link>

        {/* Role Navigation Portal Buttons */}
        <nav className="hidden lg:flex items-center space-x-1">
          {user.role === 'PHC_USER' && (
            <Link
              to="/phc"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                location.pathname === '/phc'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>PHC Clinic Dashboard</span>
            </Link>
          )}

          {user.role === 'CLINICIAN' && (
            <Link
              to="/hospital"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                location.pathname === '/hospital'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Hospital Triage &amp; Intake</span>
            </Link>
          )}

          {user.role === 'REFERRAL_COORDINATOR' && (
            <Link
              to="/triage"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                location.pathname === '/triage'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Transfer Coordination</span>
            </Link>
          )}

          {user.role === 'ADMIN' && (
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
              <Link
                to="/admin"
                className={`px-2.5 py-1 rounded font-semibold transition ${
                  location.pathname === '/admin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Governance
              </Link>
              <Link
                to="/hospital"
                className={`px-2.5 py-1 rounded font-semibold transition ${
                  location.pathname === '/hospital' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Hospital
              </Link>
              <Link
                to="/phc"
                className={`px-2.5 py-1 rounded font-semibold transition ${
                  location.pathname === '/phc' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                PHC
              </Link>
              <Link
                to="/triage"
                className={`px-2.5 py-1 rounded font-semibold transition ${
                  location.pathname === '/triage' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Coordination
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Middle: Global Quick Search Input */}
      <div className="flex-1 max-w-xs hidden xl:block">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records, referrals..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Connectivity, Facility Context, User & Sign Out */}
      <div className="flex items-center space-x-2.5">
        {/* Offline Simulation Switcher */}
        <div className="hidden items-center space-x-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[10px] font-bold sm:flex">
          <button
            onClick={() => toggleSimulatedOffline(false)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
              activeOnline ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Switch to live cloud sync mode"
          >
            <Wifi className="w-3 h-3" />
            <span>ONLINE</span>
          </button>
          <button
            onClick={() => toggleSimulatedOffline(true)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
              !activeOnline ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Simulate network loss (queues referrals locally in Dexie.js)"
          >
            <WifiOff className="w-3 h-3" />
            <span>OFFLINE</span>
          </button>
        </div>

        {/* Connectivity Status Pill */}
        <div className="hidden items-center space-x-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold sm:flex">
          <div className={`w-2 h-2 rounded-full ${activeOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className={activeOnline ? 'text-emerald-700 text-[10px]' : 'text-amber-800 text-[10px]'}>
            {activeOnline ? 'SYNC READY' : 'OFFLINE MODE'}
          </span>
        </div>

        {/* PWA Install Button */}
        {!isInstalled && (isInstallable || isIOS) && (
          <button
            onClick={installApp}
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Install SwasthyaSetu as an offline mobile app"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Install App</span>
          </button>
        )}

        {/* Notifications */}
        <button
          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer relative"
          title="Clinical Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
        </button>

        {/* Facility Context & User Avatar */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-800 leading-none">{user.name}</div>
            <div className="text-[10px] text-slate-500 flex items-center justify-end space-x-1 mt-0.5">
              <Building2 className="w-2.5 h-2.5 text-slate-400" />
              <span className="truncate max-w-[130px]">{user.facility?.name || 'District Network'}</span>
            </div>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-xs font-bold text-white shadow-sm">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          {/* Dedicated Sign Out Button */}
          <button
            onClick={logout}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer ml-1"
            title="Sign out of SwasthyaSetu"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
