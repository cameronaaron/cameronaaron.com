// Service Worker for Cameron Aaron Portfolio
// Version 1.0.0

const CACHE_VERSION = 'v1';
const CACHE_NAME = `cameron-aaron-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/profile.webp',
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

// Route patterns and their strategies
const ROUTE_STRATEGIES = [
  { pattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/, strategy: CACHE_STRATEGIES.CACHE_FIRST },
  { pattern: /\.(?:woff|woff2|ttf|eot)$/, strategy: CACHE_STRATEGIES.CACHE_FIRST },
  { pattern: /\.(?:js|css)$/, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE },
  { pattern: /\.(?:html)$/, strategy: CACHE_STRATEGIES.NETWORK_FIRST },
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching precache assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Find matching strategy
  const matchedRoute = ROUTE_STRATEGIES.find((route) => 
    route.pattern.test(url.pathname)
  );

  if (matchedRoute) {
    event.respondWith(handleRequest(request, matchedRoute.strategy));
  } else {
    event.respondWith(handleRequest(request, CACHE_STRATEGIES.NETWORK_FIRST));
  }
});

// Request handler with strategy
async function handleRequest(request, strategy) {
  const cache = await caches.open(CACHE_NAME);

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cache);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cache);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cache);
    
    default:
      return networkFirst(request, cache);
  }
}

// Cache-first strategy
async function cacheFirst(request, cache) {
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return getOfflineFallback();
  }
}

// Network-first strategy
async function networkFirst(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Network failed, trying cache:', error);
    const cached = await cache.match(request);
    return cached || getOfflineFallback();
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cache) {
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

// Get offline fallback
async function getOfflineFallback() {
  const cache = await caches.open(CACHE_NAME);
  return cache.match(OFFLINE_URL) || new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
