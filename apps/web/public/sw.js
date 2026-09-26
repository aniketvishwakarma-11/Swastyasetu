const CACHE_NAME = 'swastyasetu-cache-v1.0.1';
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
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SwasthyaSetu PWA] Pre-cache warning:', err);
      })
  );
});

// Activate Event: Clean up stale caches and take immediate control of clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SwasthyaSetu PWA] Removing outdated cache:', name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Intelligent routing strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g. POST /api/referrals are managed by Dexie.js syncQueue)
  if (request.method !== 'GET') {
    return;
  }

  // 1. Navigation Requests (HTML Pages / Routes like /phc, /hospital, /triage)
  // Strategy: Network-First with SPA fallback to cached /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, cache copy of updated page
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback: serve cached index.html so React Router takes over
          console.log('[SwasthyaSetu PWA] Offline navigation detected — serving cached SPA shell');
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = (await cache.match(request)) || (await cache.match('/index.html')) || (await cache.match('/'));
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(
            `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;">
            <h2>SwasthyaSetu Offline Mode</h2>
            <p>You are currently offline. Please open your Primary Health Centre or Hospital dashboard.</p>
            <a href="/" style="color:#0d9488;font-weight:bold;">Return to Home</a>
            </body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 2. API Requests (/api/*)
  // Strategy: Network-First. Let client Dexie.js handle offline persistence if network drops.
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request).catch(async () => {
        // Return structured offline JSON response
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            error: 'DEVICE_OFFLINE',
            message: 'Network unreachable. Operating in local offline-first continuity mode.',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // 3. Static Assets (JS chunks, CSS stylesheets, images, SVG fonts)
  // Strategy: Cache-First with Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, nothing to revalidate
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Skip waiting message handler for seamless PWA updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
