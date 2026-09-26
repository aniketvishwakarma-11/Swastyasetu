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

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  if (isAuthPage) return null;

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

        {/* Primary Action Button */}
        {!isPortalRoute ? (
          <Link
            to={getDashboardRoute()}
            className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs truncate"
          >
            <span>{user ? 'Open Portal' : 'Staff Login'}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        ) : (
          <div className="flex-1 text-right text-[10px] text-slate-500 font-semibold truncate pr-1">
            {user?.name || 'Healthcare Practitioner'}
          </div>
        )}
      </div>
    </div>
  );
};
