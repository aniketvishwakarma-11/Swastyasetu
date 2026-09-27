import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PhoneCall, Wifi, WifiOff, ArrowRight, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../hooks/usePWA';

export const MobileQuickBar: React.FC = () => {
  const { user } = useAuth();
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  const getDashboardRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'PHC_USER':
        return '/phc';
      case 'CLINICIAN':
        return '/hospital';
      case 'REFERRAL_COORDINATOR':
        return '/triage';
      case 'ADMIN':
        return '/admin';
      default:
        return '/login';
    }
  };

  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  const isPortalRoute = ['/phc', '/hospital', '/triage', '/admin'].includes(location.pathname);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5 shadow-lg">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Network status pill */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border shrink-0 ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span>ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-600 animate-pulse" />
              <span>OFFLINE SYNC</span>
            </>
          )}
        </div>

        {/* 108 Emergency Dial Action */}
        <a
          href="tel:108"
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-[10px] font-bold transition-colors shrink-0"
        >
          <PhoneCall className="w-3 h-3 text-rose-600" />
          <span>Call 108</span>
        </a>

        {/* PWA Mobile Install Action */}
        {!isInstalled && (isInstallable || isIOS) && (
          <button
            onClick={installApp}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 rounded-lg text-[10px] font-bold transition-colors shrink-0 cursor-pointer"
            title="Install App"
          >
            <Download className="w-3 h-3 text-teal-600" />
            <span>Install</span>
          </button>
        )}

        {/* Primary Action / Portal Controls */}
        {!isPortalRoute ? (
          <Link
            to={getDashboardRoute()}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs truncate transition-colors"
          >
            <span>{user ? 'Open Portal' : 'Staff Login'}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        ) : location.pathname === '/phc' ? (
          <div className="flex-1 flex items-center justify-end space-x-1.5">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('phc-quick-action', { detail: 'vitals' }))}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
              title="Record Rapid Vitals"
            >
              Vitals
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('phc-quick-action', { detail: 'new-referral' }))}
              className="flex items-center space-x-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
              title="New Referral"
            >
              <span>+ Referral</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-end space-x-2">
            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-1 rounded-lg truncate">
              {user?.role?.replace('_', ' ') || 'PORTAL'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
