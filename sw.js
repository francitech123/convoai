// ============================================================
// SERVICE WORKER - OAU CBE Practice
// Version: 2.0.0
// ============================================================

const CACHE_NAME = 'oau-cbe-v2.0.0';
const OFFLINE_URL = '/offline.html';

// ============================================================
// ASSETS TO CACHE
// ============================================================
const STATIC_ASSETS = [
  // Main pages
  '/app.html',
  '/login.html',
  '/register.html',
  '/verify-device.html',
  '/forgot-password.html',
  
  // Feature pages
  '/exam.html',
  '/test.html',
  '/study.html',
  '/study-manage.html',
  '/studybulk.html',
  '/ai.html',
  '/chat.html',
  '/leaderboard.html',
  '/notifications.html',
  '/profile.html',
  '/submit.html',
  
  // Info pages
  '/about.html',
  '/developer.html',
  '/privacy.html',
  '/terms.html',
  '/faq.html',
  '/contact.html',
  
  // Static assets
  '/logo.svg',
  '/config.js',
  '/api.js',
  '/auth.js',
  '/auth-check.js',
  '/utils.js',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
  
  // Admin pages (optional - can be added later)
  // '/admin/admin-login.html',
  // '/admin/adminDashboard.html',
  
  // External resources (CDN)
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'
];

// ============================================================
// INSTALL EVENT
// ============================================================
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// ============================================================
// ACTIVATE EVENT
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Activated, claiming clients...');
      return self.clients.claim();
    })
  );
});

// ============================================================
// FETCH EVENT
// ============================================================
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip cross-origin requests except CDN
  if (url.origin !== self.location.origin) {
    if (url.hostname === 'fonts.googleapis.com' || 
        url.hostname === 'cdnjs.cloudflare.com' ||
        url.hostname === 'fonts.gstatic.com') {
      event.respondWith(
        caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(request).then((response) => {
              const clonedResponse = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, clonedResponse);
              });
              return response;
            });
          })
      );
      return;
    }
    event.respondWith(fetch(request));
    return;
  }
  
  // Same-origin requests
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              })
              .catch((error) => {
                console.error('[Service Worker] Cache put error:', error);
              });
            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch error:', error);
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html')
                .then((offlineResponse) => {
                  if (offlineResponse) return offlineResponse;
                  return new Response(
                    '<h1>You are offline</h1><p>Please check your internet connection.</p>',
                    { headers: { 'Content-Type': 'text/html' } }
                  );
                });
            }
            return new Response('Network error', { status: 503 });
          });
      })
  );
});

// ============================================================
// MESSAGE EVENT
// ============================================================
self.addEventListener('message', (event) => {
  const data = event.data;
  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (data && data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  let data = {
    title: 'OAU CBE Practice',
    body: 'New notification',
    icon: '/logo.svg',
    badge: '/icons/icon-72x72.png'
  };
  
  if (event.data) {
    try {
      data = JSON.parse(event.data.text());
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/logo.svg',
    badge: data.badge || '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/app'
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ============================================================
// NOTIFICATION CLICK
// ============================================================
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();
  
  const url = event.notification.data?.url || '/app';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('[Service Worker] Registered successfully');