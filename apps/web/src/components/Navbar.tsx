import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Wifi, WifiOff, LogOut, Building2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'CLINICIAN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PHC_USER':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'REFERRAL_COORDINATOR':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ADMIN':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Facility */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-sm shadow-teal-600/20 group-hover:bg-teal-700 transition-colors">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-bold text-slate-900 leading-tight">SwasthyaSetu</span>
              <span className="text-[10px] font-semibold text-teal-700 px-1.5 py-0.2 bg-teal-50 border border-teal-200 rounded">
                MediVault
              </span>
            </div>
            {user?.facility ? (
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>{user.facility.name}</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">Continuity Network</span>
            )}
          </div>
        </Link>

        {/* Role navigation links for easy access */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200 text-xs font-medium">
            {(user.role === 'PHC_USER' || user.role === 'ADMIN') && (
              <Link
                to="/phc"
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors"
              >
                PHC Referrals
              </Link>
            )}
            {(user.role === 'CLINICIAN' || user.role === 'ADMIN') && (
              <Link
                to="/hospital"
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors"
              >
                District Hospital Triage
              </Link>
            )}
            {(user.role === 'REFERRAL_COORDINATOR' || user.role === 'ADMIN') && (
              <Link
                to="/triage"
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors"
              >
                Transfer Board
              </Link>
            )}
            {user.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors"
              >
                Admin Console
              </Link>
            )}
          </nav>
        )}
      </div>

      {/* Network Connectivity & User Profile Actions */}
      <div className="flex items-center space-x-3">
        {/* Offline Simulation Toggle */}
        <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1 border border-slate-200 text-[11px] font-medium">
          <button
            onClick={() => setSimulatedOffline(false)}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
              activeOnline ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Switch to live network mode"
          >
            <Wifi className="w-3 h-3" />
            <span>ONLINE</span>
          </button>
          <button
            onClick={() => setSimulatedOffline(true)}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
              !activeOnline ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Simulate complete network loss (queues referrals locally)"
          >
            <WifiOff className="w-3 h-3" />
            <span>OFFLINE</span>
          </button>
        </div>

        {/* Live Status Pill */}
        <div className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-white">
          <div className={`w-2 h-2 rounded-full ${activeOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className={activeOnline ? 'text-emerald-700' : 'text-amber-700'}>
            {activeOnline ? 'SYNC READY' : 'OFFLINE MODE'}
          </span>
        </div>

        {/* User Account & Role Badge */}
        {user ? (
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-none">{user.name}</div>
              <span
                className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold border uppercase tracking-wider ${getRoleBadgeColor(
                  user.role
                )}`}
              >
                {user.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-medium transition-colors"
              title="Sign out of SwasthyaSetu"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-teal-700 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-3 py-1.5 text-xs font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm transition-colors"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
