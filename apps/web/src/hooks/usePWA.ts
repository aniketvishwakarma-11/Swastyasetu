import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches;
    const hasStoredFlag = localStorage.getItem('swasthya_pwa_installed') === 'true';
    return isStandalone || hasStoredFlag;
  });
  const [isIOS, setIsIOS] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // 1. Detect if already installed / running standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches;

    const hasStoredFlag = localStorage.getItem('swasthya_pwa_installed') === 'true';
    if (isStandalone || hasStoredFlag) {
      setIsInstalled(true);
    }

    // Check with getInstalledRelatedApps if supported by the browser
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any)
        .getInstalledRelatedApps()
        .then((relatedApps: any[]) => {
          if (Array.isArray(relatedApps) && relatedApps.length > 0) {
            setIsInstalled(true);
            try {
              localStorage.setItem('swasthya_pwa_installed', 'true');
            } catch {}
          } else if (!isStandalone && !(window.navigator as any).standalone) {
            // Not installed and not standalone
            try {
              localStorage.removeItem('swasthya_pwa_installed');
            } catch {}
            setIsInstalled(false);
          }
        })
        .catch(() => {});
    }

    // Listen for display mode changes (e.g. app launched or pinned)
    const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        try {
          localStorage.setItem('swasthya_pwa_installed', 'true');
        } catch {}
      }
    };
    try {
      standaloneMediaQuery.addEventListener('change', handleDisplayChange);
    } catch {}

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // 3. Listen for BeforeInstallPromptEvent (Chrome, Edge, Samsung Internet, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('swasthya_pwa_installed', 'true');
      } catch {}
      console.log('[SwasthyaSetu PWA] Application successfully installed!');
    };

    // 5. Online/Offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 6. Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[SwasthyaSetu PWA] Service Worker registered with scope:', registration.scope);

            // Check for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      console.log('[SwasthyaSetu PWA] New update available; ready to reload.');
                    } else {
                      console.log('[SwasthyaSetu PWA] Content is cached for offline use.');
                    }
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.warn('[SwasthyaSetu PWA] Service Worker registration failed:', error);
          });
      });
    }

    return () => {
      try {
        standaloneMediaQuery.removeEventListener('change', handleDisplayChange);
      } catch {}
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[SwasthyaSetu PWA] User accepted the installation prompt');
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        try {
          localStorage.setItem('swasthya_pwa_installed', 'true');
        } catch {}
        return true;
      } else {
        console.log('[SwasthyaSetu PWA] User dismissed the installation prompt');
        return false;
      }
    } catch (err) {
      console.error('[SwasthyaSetu PWA] Error triggering install prompt:', err);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isOffline,
    installApp,
  };
}
