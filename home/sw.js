const VERSION = '1.1.7';
const CACHE_NAME = `my-pwa-notes-cache-${VERSION}`;
const RUNTIME_CACHE = `runtime-cache-${VERSION}`;

// Compute the scope (folder) where this service worker is installed.
// Using the SW script location ensures the cached paths match the served site (works under /My-Notes/home/).
const SW_SCOPE = new URL('.', self.location).pathname;

const urlsToCache = [
  SW_SCOPE,
  SW_SCOPE + 'index.html',
  SW_SCOPE + 'manifest.json',
  SW_SCOPE + 'images/icon-192x192.png',
  SW_SCOPE + 'images/icon-512x512.png',
  SW_SCOPE + 'script.js',
  SW_SCOPE + 'paths.js',
  SW_SCOPE + 'offline.html'
];

// Install: cache static assets and immediately take control
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urlsToCache);
    // Activate worker immediately so it can control pages
    await self.skipWaiting();
    // Notify clients that a new service worker has been installed (but not necessarily controlling yet)
    const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
    clientsList.forEach(client => client.postMessage({ type: 'SW_INSTALLED' }));
  })());
});

// Activate: clean up old caches and claim clients
self.addEventListener('activate', event => {
  const expectedCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => {
        if (!expectedCaches.includes(name)) {
          return caches.delete(name);
        }
        return null;
      })
    );
    await self.clients.claim();
    // Notify clients that the new service worker is now active
    const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
    clientsList.forEach(client => client.postMessage({ type: 'SW_ACTIVATED' }));
  })());
});

// Fetch: network-first for navigation requests (SPA), cache-first for others.
self.addEventListener('fetch', event => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // For navigation requests, try network first then fallback to cache/offline page
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(request);
        // Update runtime cache with navigation responses if needed
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch (err) {
  const cached = await caches.match(request);
  if (cached) return cached;
  return caches.match(SW_SCOPE + 'offline.html');
      }
    })());
    return;
  }

  // For other requests, respond with cache-first, then network and populate runtime cache
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      // Only cache successful responses (status 200) and same-origin/CORS
      if (response && response.status === 200 && response.type !== 'opaque') {
        const runtimeCache = await caches.open(RUNTIME_CACHE);
        runtimeCache.put(request, response.clone());
      }
      return response;
    } catch (err) {
      // If request is for an image and offline, return an inline SVG placeholder
      if (request.destination === 'image' || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(request.url)) {
        const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23eee'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='Arial, Helvetica, sans-serif' font-size='20'>Image unavailable</text></svg>`;
        return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
      }
  return caches.match(SW_SCOPE + 'offline.html');
    }
  })());
});

// Listen for messages from the page
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
