import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { db } from '../../lib/db';

interface ConnectivityCardProps {
  /** Called when the user clicks Force Sync — reuses same no-op behavior as before */
  onForceSync: () => void;
}

export const ConnectivityCard: React.FC<ConnectivityCardProps> = ({ onForceSync }) => {
  // Real browser connectivity — same pattern used by Navbar
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Mirror window online/offline events (same approach as Navbar)
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

  // Read actual pending count from Dexie — only PENDING/QUEUED items
  useEffect(() => {
    let cancelled = false;

    async function refreshCount() {
      try {
        const count = await db.syncQueue
          .where('status')
          .anyOf('PENDING', 'QUEUED', 'FAILED')
          .count();
        if (!cancelled) setPendingCount(count);
      } catch {
        // IndexedDB not yet seeded / empty — treat as 0
        if (!cancelled) setPendingCount(0);
      }
    }

    refreshCount();

    // Re-check whenever a referral-related page event fires
    // (crude but avoids pulling in a subscription library)
    const id = setInterval(refreshCount, 5_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await onForceSync();
    } finally {
      // Brief visual feedback, then re-check count
      setTimeout(() => setIsSyncing(false), 1200);
    }
  };

  return (
    <div
      className={`rounded-2xl border shadow-sm p-5 transition-colors ${
        isOnline
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      {/* Status header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
          )}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span
              className={`text-sm font-bold ${
                isOnline ? 'text-emerald-800' : 'text-amber-800'
              }`}
            >
              {isOnline ? 'Online — Sync Ready' : 'Offline Mode'}
            </span>
          </div>
        </div>

        {/* Live indicator dot */}
        <div className="flex items-center space-x-1.5 text-[11px] font-semibold">
          <div
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
            aria-hidden="true"
          />
          <span className={isOnline ? 'text-emerald-700' : 'text-amber-700'}>
            {isOnline ? 'LIVE' : 'LOCAL'}
          </span>
        </div>
      </div>

      {/* Offline message (shown only when offline) */}
      {!isOnline && (
        <div className="flex items-start space-x-2 mb-3 text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
          <span>
            Referrals are saved on this device and will sync when you're back online.
          </span>
        </div>
      )}

      {/* Pending count */}
      <div className="flex items-baseline space-x-2 mb-3">
        <span
          className={`text-3xl font-extrabold tabular-nums ${
            pendingCount > 0 ? 'text-amber-700' : 'text-slate-800'
          }`}
        >
          {pendingCount}
        </span>
        <span className="text-xs text-slate-500">pending on this device</span>
      </div>

      {/* Force Sync button — always visible in this card */}
      <button
        onClick={handleForceSync}
        disabled={isSyncing}
        className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-xl border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
          isOnline
            ? 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-100'
            : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-100'
        }`}
        aria-label={isSyncing ? 'Syncing…' : 'Force sync pending referrals now'}
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <span>{isSyncing ? 'Syncing…' : 'Force Sync Queue'}</span>
      </button>
    </div>
  );
};
