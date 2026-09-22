import { useState, useEffect, useCallback } from 'react';
import { localDb } from './db';
import { apiRequest } from './api';

export function useNetworkSync() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Refresh pending count from Dexie
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await localDb.syncQueue.count();
      setPendingCount(count);
    } catch (e) {
      console.error('[IndexedDB count error]', e);
    }
  }, []);

  // Flush queued events to backend API
  const syncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
      setIsSyncing(true);
      const queuedEvents = await localDb.syncQueue.toArray();

      if (queuedEvents.length === 0) {
        setIsSyncing(false);
        return;
      }

      const res = await apiRequest('/sync/events', {
        method: 'POST',
        body: JSON.stringify({ events: queuedEvents }),
      });

      const responseEvents = (res as any).events || (res as any).data?.events;
      if (Array.isArray(responseEvents)) {
        for (const evtResult of responseEvents) {
          if (evtResult.status === 'SYNCED') {
            // Remove from queue
            await localDb.syncQueue.where('eventId').equals(evtResult.eventId).delete();

            // Update local referral record status
            await localDb.referrals
              .where('localId')
              .equals(evtResult.eventId)
              .modify({ syncStatus: 'SYNCED', lastSyncedAt: new Date().toISOString() });
          }
        }
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.error('[Sync flush error]', err);
    } finally {
      setIsSyncing(false);
      await refreshPendingCount();
    }
  }, [isSyncing, refreshPendingCount]);

  // Periodic heartbeat & online/offline listeners
  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Heartbeat check every 15s to verify server connectivity
    const interval = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('/api/health', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          if (!isOnline) {
            setIsOnline(true);
            syncNow();
          }
        } else {
          setIsOnline(false);
        }
      } catch {
        // If ping fails
        if (isOnline) setIsOnline(false);
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline, refreshPendingCount, syncNow]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncNow,
    refreshPendingCount,
  };
}
