import React, { useEffect, useRef, useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  CloudOff,
  Cloud,
  X,
} from 'lucide-react';

interface OfflineStatusBarProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncTime: Date | null;
  onSyncNow: () => void;
  onRetryFailed: () => void;
}

export const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({
  isOnline,
  isSyncing,
  pendingCount,
  failedCount,
  lastSyncTime,
  onSyncNow,
  onRetryFailed,
}) => {
  const prevOnlineRef = useRef(isOnline);
  const [showReconnectToast, setShowReconnectToast] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect transition from offline → online and show reconnect toast
  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (isOnline && wasOffline) {
      setShowReconnectToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowReconnectToast(false), 5000);
    }

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [isOnline]);

  // Listen for SW update notifications dispatched from main.tsx
  useEffect(() => {
    const handleSWUpdate = () => setShowUpdateToast(true);
    window.addEventListener('swasthya:sw-updated', handleSWUpdate);
    return () => window.removeEventListener('swasthya:sw-updated', handleSWUpdate);
  }, []);

  const handleApplyUpdate = () => {
    setShowUpdateToast(false);
    navigator.serviceWorker?.getRegistration().then((reg) => {
      reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    });
  };

  // Nothing to show — app is online and clean
  if (isOnline && pendingCount === 0 && failedCount === 0 && !showReconnectToast && !showUpdateToast) {
    return null;
  }

  return (
    <>
      {/* ── Persistent Offline / Sync Status Bar ── */}
      {(!isOnline || pendingCount > 0 || failedCount > 0) && (
        <div
          className={`w-full px-4 py-2 flex items-center justify-between gap-3 text-xs font-semibold z-50 transition-all ${
            !isOnline
              ? 'bg-slate-900 text-slate-100 border-b border-slate-700'
              : failedCount > 0
              ? 'bg-rose-600 text-white border-b border-rose-700'
              : 'bg-amber-500 text-white border-b border-amber-600'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 flex-wrap">
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
                <span>You are offline — referrals and vitals are saved locally and will sync when connection restores.</span>
              </>
            ) : failedCount > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {failedCount} record{failedCount > 1 ? 's' : ''} failed to sync. Check your connection and retry.
                </span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                <span>
                  {pendingCount} record{pendingCount > 1 ? 's' : ''} pending upload to cloud…
                </span>
              </>
            )}

            {lastSyncTime && isOnline && (
              <span className="opacity-70 hidden sm:inline">
                · Last sync {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {failedCount > 0 && isOnline && (
              <button
                onClick={onRetryFailed}
                className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Retry failed sync events"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Failed</span>
              </button>
            )}

            {pendingCount > 0 && isOnline && !isSyncing && (
              <button
                onClick={onSyncNow}
                className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Cloud className="w-3 h-3" />
                <span>Sync Now ({pendingCount})</span>
              </button>
            )}

            {isSyncing && (
              <span className="flex items-center gap-1.5 opacity-80">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing…</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Reconnected Toast ── */}
      {showReconnectToast && (
        <div className="fixed top-4 right-4 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-emerald-600 text-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 max-w-sm">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold">Back Online!</p>
              <p className="text-[11px] text-emerald-100">
                {pendingCount > 0
                  ? `Syncing ${pendingCount} pending record${pendingCount > 1 ? 's' : ''} to cloud…`
                  : 'All records are synchronized.'}
              </p>
            </div>
            <button
              onClick={() => setShowReconnectToast(false)}
              className="text-white/60 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── SW Update Available Toast ── */}
      {showUpdateToast && (
        <div className="fixed bottom-20 md:bottom-6 left-4 z-[100] animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="bg-slate-900 text-white rounded-2xl px-4 py-3.5 shadow-2xl flex items-center gap-3 max-w-sm border border-slate-700">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">App Update Ready</p>
              <p className="text-[11px] text-slate-400">A new version of SwasthyaSetu is installed.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyUpdate}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Reload
              </button>
              <button
                onClick={() => setShowUpdateToast(false)}
                className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
