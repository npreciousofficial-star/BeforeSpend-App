const CACHE_NAME = 'beforespend-pwa-v6';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/pwa-icon.png',
  '/apple-touch-icon.png',
  '/logo.png',
  '/favicon.ico'
];

// Install Event - Precache core app shell & activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale cache versions & claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA SW] Removing obsolete cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Sub-50ms instant cold boot for home screen launch
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore non-http(s) schemes (e.g. chrome-extension, ws)
  if (!url.protocol.startsWith('http')) return;

  // Ignore cross-origin API requests (e.g. Supabase, IP lookup, Exchange rates)
  if (url.origin !== location.origin) return;

  // Bypass service worker in Vite dev server mode
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('vite') ||
    url.pathname.includes('node_modules') ||
    url.search.includes('t=') ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1'
  ) {
    return;
  }

  // 1. Navigation / App Shell Request (e.g. user opening from home screen)
  // Serve cached index.html INSTANTLY (0ms delay), revalidate in background
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      caches.match('/index.html').then((cachedIndex) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put('/index.html', responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedIndex);

        return cachedIndex || fetchPromise;
      })
    );
    return;
  }

  // 2. Immutable Vite Assets (/assets/*) & Static Files (.js, .css, .png, .jpg, .svg, .woff2)
  // Strategy: Cache-First for instant 0ms execution
  const isHashedAsset = url.pathname.startsWith('/assets/');
  const isStaticFile = url.pathname.endsWith('.js') ||
                       url.pathname.endsWith('.css') ||
                       url.pathname.endsWith('.png') ||
                       url.pathname.endsWith('.jpg') ||
                       url.pathname.endsWith('.ico') ||
                       url.pathname.endsWith('.svg') ||
                       url.pathname.endsWith('.woff2') ||
                       url.pathname.endsWith('.json');

  if (isHashedAsset || isStaticFile) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Fallback: Stale-While-Revalidate for other local GET requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || caches.match('/index.html'));

      return cachedResponse || fetchPromise;
    })
  );
});

// Push Event - Native Web Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: 'BeforeSpend Alert', body: 'You have a new financial alert.', url: '/dashboard' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'Keep track of your budget allocations with BeforeSpend.',
    icon: data.icon || '/favicon.png',
    badge: data.badge || '/favicon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'BeforeSpend Alert 🔔', options)
  );
});

// Notification Click Event - Focus or launch BeforeSpend app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

