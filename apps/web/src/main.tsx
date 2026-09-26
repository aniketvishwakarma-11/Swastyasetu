import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ── Service Worker Registration with Update Detection ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SwasthyaSetu PWA] Service Worker registered, scope:', registration.scope);

        // Watch for a newly installed SW waiting to activate
        const checkForWaiting = (reg: ServiceWorkerRegistration) => {
          if (reg.waiting) {
            // A new SW is installed but waiting — notify the UI
            window.dispatchEvent(new CustomEvent('swasthya:sw-updated'));
          }
        };

        // Check immediately (in case SW was already waiting before this page loaded)
        checkForWaiting(registration);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version installed, old controller still active — prompt update
              checkForWaiting(registration);
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[SwasthyaSetu PWA] Service Worker registration failed:', err);
      });

    // When the SW controller changes (after skip-waiting), reload to activate new version
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}
