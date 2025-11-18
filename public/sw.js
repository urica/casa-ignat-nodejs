/**
 * Casa Ignat - Service Worker
 * Offline support and caching strategy
 */

const CACHE_VERSION = 'casa-ignat-v1';
const CACHE_ASSETS = 'assets';
const CACHE_IMAGES = 'images';
const CACHE_PAGES = 'pages';

// Assets to cache immediately
const PRECACHE_ASSETS = [
    '/',
    '/css/style.css',
    '/css/responsive.css',
    '/js/main.js',
    '/js/responsive.js',
    '/img/logo.png',
    '/img/favicon.ico',
    '/offline.html'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_VERSION + '-' + CACHE_ASSETS)
            .then((cache) => {
                console.log('[SW] Precaching assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('casa-ignat-') && name !== CACHE_VERSION)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip admin routes
    if (url.pathname.startsWith('/admin')) {
        return;
    }

    // Skip API routes
    if (url.pathname.startsWith('/api')) {
        return;
    }

    // Handle different types of requests
    if (request.destination === 'image') {
        event.respondWith(cacheFirstStrategy(request, CACHE_IMAGES));
    } else if (request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
        event.respondWith(cacheFirstStrategy(request, CACHE_ASSETS));
    } else if (request.destination === 'document') {
        event.respondWith(networkFirstStrategy(request, CACHE_PAGES));
    } else {
        event.respondWith(networkFirstStrategy(request, CACHE_ASSETS));
    }
});

// Cache First Strategy (for images, CSS, JS)
async function cacheFirstStrategy(request, cacheName) {
    const cache = await caches.open(CACHE_VERSION + '-' + cacheName);
    const cached = await cache.match(request);

    if (cached) {
        console.log('[SW] Serving from cache:', request.url);
        return cached;
    }

    try {
        const response = await fetch(request);

        // Only cache successful responses
        if (response.status === 200) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.log('[SW] Fetch failed:', request.url);

        // Return offline page for documents
        if (request.destination === 'document') {
            return cache.match('/offline.html');
        }

        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Network First Strategy (for HTML pages)
async function networkFirstStrategy(request, cacheName) {
    const cache = await caches.open(CACHE_VERSION + '-' + cacheName);

    try {
        const response = await fetch(request);

        // Cache successful responses
        if (response.status === 200) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);

        const cached = await cache.match(request);

        if (cached) {
            return cached;
        }

        // Return offline page for documents
        if (request.destination === 'document') {
            return cache.match('/offline.html');
        }

        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-forms') {
        event.waitUntil(syncForms());
    }
});

async function syncForms() {
    // Get pending form submissions from IndexedDB
    // This would need to be implemented with IndexedDB
    console.log('[SW] Syncing offline form submissions...');
}

// Push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    const data = event.data ? event.data.json() : {};

    const options = {
        body: data.body || 'Aveți o notificare nouă',
        icon: '/img/icon-192.png',
        badge: '/img/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Casa Ignat', options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');

    event.notification.close();

    const url = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then((clientList) => {
                // Check if there's already a window open
                for (let client of clientList) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }

                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// Message handler (for communication with main thread)
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls || [];
        event.waitUntil(
            caches.open(CACHE_VERSION + '-' + CACHE_PAGES)
                .then((cache) => cache.addAll(urls))
        );
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys()
                .then((cacheNames) => {
                    return Promise.all(
                        cacheNames.map((name) => caches.delete(name))
                    );
                })
        );
    }
});
