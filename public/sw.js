// WHG Team Portal — Service Worker
// Provides offline caching for static assets and API responses
//
// MAINTENANCE NOTES:
// - Bump cache version numbers (STATIC_CACHE, API_CACHE) after any change
//   to force existing installs to clear old caches.
// - Add new API routes to CACHEABLE_API_ROUTES if they return data that
//   should be available offline (read-only, non-sensitive routes only).
// - Never cache auth routes, user-specific mutations, or chat responses.
// - The activate handler auto-deletes any cache not matching current names.

const CACHE_NAME = 'whg-team-v2';
const STATIC_CACHE = 'whg-static-v2';
const API_CACHE = 'whg-api-v2';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/dashboard',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/logos/whg.png',
  '/logos/ichiban-white.png',
  '/logos/boru-white.png',
  '/logos/shokudo-white.png',
];

// API routes to cache with network-first strategy
const CACHEABLE_API_ROUTES = [
  '/api/handbook',
  '/api/policies',
  '/api/restaurants',
  '/api/popular-questions',
];

// Max age for cached API responses (24 hours)
const API_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Install: pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.log('SW: Pre-cache partial failure (non-blocking):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip auth-related requests
  if (url.pathname.startsWith('/api/auth') || url.pathname.startsWith('/auth')) return;

  // API routes: network-first with stale cache fallback (max 24h)
  if (CACHEABLE_API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              // Store timestamp header so we can expire stale entries
              const headers = new Headers(clone.headers);
              headers.set('sw-cached-at', Date.now().toString());
              const timedResponse = new Response(clone.body, { status: clone.status, statusText: clone.statusText, headers });
              cache.put(request, timedResponse);
            });
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (!cached) return cached;
            // Only serve cache if less than 24 hours old
            const cachedAt = cached.headers.get('sw-cached-at');
            if (cachedAt && (Date.now() - Number(cachedAt)) > API_CACHE_MAX_AGE_MS) {
              return undefined; // expired, don't serve stale data
            }
            return cached;
          })
        )
    );
    return;
  }

  // Static assets & pages: cache-first with network fallback
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/logos/') ||
    url.pathname.startsWith('/splash/') ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests: network-first, offline fallback page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }
});
