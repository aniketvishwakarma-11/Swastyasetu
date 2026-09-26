const CACHE_NAME = 'swastyasetu-cache-v1.1.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/og-image.svg',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icons/pwa-192x192.png',
  '/icons/pwa-512x512.png',
  '/icons/maskable-icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Install Event: Pre-cache application shell and core offline assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SwasthyaSetu PWA] Pre-caching static assets for offline resilience');
        // Add individually so one missing icon doesn't abort the whole install
        return Promise.allSettled(
          STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
        );
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SwasthyaSetu PWA] Pre-cache warning:', err);
      })
  );
});

// Activate Event: Clean up stale caches, take control of all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SwasthyaSetu PWA] Removing outdated cache:', name);
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Intelligent routing strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Ignore non-GET requests (POST /api/referrals are handled by Dexie.js syncQueue)
  if (request.method !== 'GET') return;

  // 1. Navigation Requests (HTML Pages / SPA Routes like /phc, /hospital)
  //    Strategy: Network-First, fall back to cached /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          console.log('[SwasthyaSetu PWA] Offline navigation — serving cached SPA shell');
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse =
            (await cache.match('/index.html')) ||
            (await cache.match('/')) ||
            (await cache.match(request));
          if (cachedResponse) return cachedResponse;
          return new Response(
            `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#0f172a;color:#e2e8f0;">
            <div style="max-width:400px;margin:0 auto;">
              <div style="width:64px;height:64px;background:#0d9488;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                <svg width="32" height="32" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
              </div>
              <h2 style="color:#2dd4bf;font-size:20px;margin-bottom:12px;">SwasthyaSetu — Offline Mode</h2>
              <p style="font-size:14px;color:#94a3b8;margin-bottom:24px;">You are currently offline. Your referrals and vitals are saved locally and will sync when your connection returns.</p>
              <a href="/" style="background:#0d9488;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Return to Dashboard</a>
            </div>
            </body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 2. API Requests (/api/*)
  //    Strategy: Network-Only. Client Dexie.js syncQueue handles offline persistence.
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({
            success: false,
            offline: true,
            error: { code: 'DEVICE_OFFLINE', message: 'Network unreachable. Operating in offline-first mode.' },
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // 3. Vite JS/CSS/Asset chunks — Cache-First with background revalidation
  //    This ensures app loads fully offline after first visit
  const isAsset =
    url.pathname.startsWith('/assets/') ||
    /\.(js|css|woff2?|ttf|otf|eot|png|jpg|jpeg|webp|gif|svg|ico)$/.test(url.pathname);

  if (isAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              (networkResponse.type === 'basic' || networkResponse.type === 'cors')
            ) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => null);

        // Serve cached immediately, revalidate in background
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Everything else — Network-First with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached || new Response('Offline', { status: 503 });
      })
  );
});

// Message handler: skip waiting for seamless update activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
