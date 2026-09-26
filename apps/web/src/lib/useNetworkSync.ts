import { useState, useEffect, useCallback } from 'react';
import { localDb } from './db';
import { apiRequest } from './api';

export function useNetworkSync() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Refresh pending and failed counts from Dexie
  const refreshPendingCount = useCallback(async () => {
    try {
      const [pending, failed] = await Promise.all([
        localDb.syncQueue.where('status').equals('PENDING').count(),
        localDb.syncQueue.where('status').equals('FAILED').count(),
      ]);
      setPendingCount(pending);
      setFailedCount(failed);
    } catch (e) {
      console.error('[IndexedDB count error]', e);
      // Fallback: count all queue items as pending
      try {
        const total = await localDb.syncQueue.count();
        setPendingCount(total);
        setFailedCount(0);
      } catch {}
    }
  }, []);

  // Flush queued events to backend API
  const syncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
      setIsSyncing(true);
      // Only sync PENDING events (not FAILED — those need explicit retry)
      const queuedEvents = await localDb.syncQueue
        .where('status')
        .equals('PENDING')
        .toArray();

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

            // Update local referral record status and server id
            const updates: any = {
              syncStatus: 'SYNCED',
              lastSyncedAt: new Date().toISOString(),
            };
            if (evtResult.entityId) {
              updates.id = evtResult.entityId;
            }
            if (evtResult.referralNumber) {
              updates.referralNumber = evtResult.referralNumber;
            }

            await localDb.referrals
              .where('localId')
              .equals(evtResult.eventId)
              .modify(updates);
          } else if (evtResult.status === 'FAILED') {
            // Mark as failed in the queue so it shows in failedCount
            await localDb.syncQueue
              .where('eventId')
              .equals(evtResult.eventId)
              .modify({ status: 'FAILED' });
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

  // Retry FAILED events — resets their status to PENDING and re-syncs
  const retryFailed = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      // Reset all FAILED items back to PENDING
      await localDb.syncQueue
        .where('status')
        .equals('FAILED')
        .modify({ status: 'PENDING', retryCount: 0 });
      await refreshPendingCount();
      await syncNow();
    } catch (err) {
      console.error('[Retry failed error]', err);
    }
  }, [refreshPendingCount, syncNow]);

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
    failedCount,
    lastSyncTime,
    syncNow,
    retryFailed,
    refreshPendingCount,
  };
}
