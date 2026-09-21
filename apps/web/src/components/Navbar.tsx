import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Wifi,
  WifiOff,
  Building2,
  Search,
  Bell,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Render clean unauthenticated topbar for /login and /signup
  if (!user) {
    return (
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-sm shadow-teal-600/20 group-hover:bg-teal-700 transition-colors">
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

  // Render authenticated topbar matching the reference screenshot
  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between z-30 shrink-0">
      {/* Left: Global Quick Search Input (Matches Reference Screenshot) */}
      <div className="flex items-center space-x-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records, patients, referrals (e.g. Ramesh)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50/80 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Right Controls: Connectivity, Emergency Alerts & Facility Context */}
      <div className="flex items-center space-x-3">
        {/* Offline Simulation Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 rounded-xl p-1 border border-slate-200 text-[10px] font-bold">
          <button
            onClick={() => setSimulatedOffline(false)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeOnline ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Switch to live cloud sync mode"
          >
            <Wifi className="w-3 h-3" />
            <span>ONLINE</span>
          </button>
          <button
            onClick={() => setSimulatedOffline(true)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              !activeOnline ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Simulate complete network loss (queues referrals locally in Dexie.js)"
          >
            <WifiOff className="w-3 h-3" />
            <span>OFFLINE</span>
          </button>
        </div>

        {/* Connectivity Status Pill */}
        <div className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-white">
          <div className={`w-2 h-2 rounded-full ${activeOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className={activeOnline ? 'text-emerald-700 text-[11px]' : 'text-amber-800 text-[11px]'}>
            {activeOnline ? 'SYNC READY' : 'OFFLINE MODE'}
          </span>
        </div>

        {/* Emergency Triage Bell Notification Icon (Matches Screenshot) */}
        <div className="relative">
          <button
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title="Clinical Triage Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white" />
          </button>
        </div>

        {/* Facility Context & User Avatar */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-slate-800 leading-none">{user.name}</div>
            <div className="text-[10px] text-slate-500 flex items-center justify-end space-x-1 mt-0.5">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[150px]">{user.facility?.name || 'District Network'}</span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user.name ? user.name.charAt(0).toUpperCase() : 'D'}
          </div>
        </div>
      </div>
    </header>
  );
};
