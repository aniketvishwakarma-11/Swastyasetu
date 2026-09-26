import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastPushPayload, setLastPushPayload] = useState<any | null>(null);

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);

      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });

      // Listen for message broadcasts from Service Worker when a push is received
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'EMERGENCY_PUSH_RECEIVED') {
          setLastPushPayload(event.data.payload);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      setIsLoading(true);

      // 1. Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setIsLoading(false);
        return false;
      }

      // 2. Fetch server VAPID public key
      const keyRes = await apiRequest('/notifications/vapid-public-key');
      const publicKey = keyRes?.data?.publicKey;

      if (!publicKey) {
        throw new Error('Failed to retrieve VAPID public key from backend');
      }

      // 3. Register push with Service Worker
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any,
        });
      }

      // 4. Send subscription to backend
      const rawSub = subscription.toJSON();
      await apiRequest('/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: rawSub.endpoint,
          keys: {
            p256dh: rawSub.keys?.p256dh,
            auth: rawSub.keys?.auth,
          },
          userAgent: navigator.userAgent,
          deviceType: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        }),
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('[usePushNotifications] Subscription error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      setIsLoading(true);
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        // Inform backend
        await apiRequest('/notifications/unsubscribe', {
          method: 'POST',
          body: JSON.stringify({ endpoint }),
        });
      }

      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('[usePushNotifications] Unsubscribe error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const sendTestAlert = useCallback(async () => {
    try {
      const res = await apiRequest('/notifications/test', { method: 'POST' });
      return res;
    } catch (err) {
      console.error('[usePushNotifications] Test alert error:', err);
      return { success: false, error: 'Failed to send test alert' };
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    lastPushPayload,
    clearLastPush: () => setLastPushPayload(null),
    subscribe,
    unsubscribe,
    sendTestAlert,
  };
}
