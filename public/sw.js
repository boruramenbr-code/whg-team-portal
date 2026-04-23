// WHG Team Portal — Service Worker
// Provides offline caching for static assets and API responses

const CACHE_NAME = 'whg-team-v1';
const STATIC_CACHE = 'whg-static-v1';
const API_CACHE = 'whg-api-v1';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/dashboard',
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
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
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

  // API routes: network-first with cache fallback
  if (CACHEABLE_API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
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

  // Navigation requests: network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/dashboard'))
    );
    return;
  }
});
