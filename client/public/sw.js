// BJJ Journal Service Worker
const CACHE_NAME = 'jits-journal-v1.0.118-fix';
const API_CACHE_NAME = 'jits-journal-api-v1.0.118-fix';

// Resources to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/assets/index.css',
  '/assets/index.js'
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/classes',
  '/api/notes',
  '/api/belts',
  '/api/auth/user',
  '/api/stats/class-stats',
  '/api/weekly-commitments'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Service Worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests - NEVER cache authentication or user-specific data
  if (url.pathname.startsWith('/api/')) {
    // CRITICAL: Never cache authentication endpoints or user-specific data
    const authEndpoints = ['/api/auth/', '/api/user/', '/api/me'];
    const isAuthRequest = authEndpoints.some(endpoint => url.pathname.startsWith(endpoint));
    
    if (isAuthRequest) {
      // Always bypass cache for authentication - go directly to network
      event.respondWith(
        fetch(request).catch(err => {
          console.log('Auth API failed:', err);
          throw err; // Don't provide fallbacks for auth
        })
      );
      return;
    }
    
    // For non-auth API requests, use cache but with fresh validation
    event.respondWith(
      fetch(request)
        .then(response => {
          // Only cache successful GET requests
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(err => {
          console.log('Network failed, trying cache:', err);
          // Only use cache as fallback for GET requests
          if (request.method === 'GET') {
            return caches.match(request).then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline fallback for specific endpoints
              if (url.pathname === '/api/classes') {
                return new Response(JSON.stringify([]), {
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              throw err;
            });
          }
          throw err;
        })
    );
    return;
  }

  // Handle static resources
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cache successful responses
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseClone));
            
            return response;
          })
          .catch(err => {
            console.log('Fetch failed:', err);
            // Return offline fallback page
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            throw err;
          });
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync event');
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync any pending data when connection is restored
      syncPendingData()
    );
  }
});

// Periodic background sync for app updates
self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-sync') {
    event.waitUntil(
      syncPendingData()
    );
  }
});

// Push notifications for BJJ reminders
self.addEventListener('push', event => {
  console.log('Service Worker: Push event');
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Time for your BJJ training!',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      actions: [
        {
          action: 'log-class',
          title: 'Log Class',
          icon: '/icon-192x192.png'
        },
        {
          action: 'view-goals',
          title: 'View Goals',
          icon: '/icon-192x192.png'
        }
      ],
      data: {
        url: '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Jits Journal', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification click event');
  event.notification.close();
  
  const action = event.action;
  let targetUrl = '/';
  
  if (action === 'log-class') {
    targetUrl = '/classes';
  } else if (action === 'view-goals') {
    targetUrl = '/';
  }
  
  event.waitUntil(
    clients.openWindow(targetUrl)
  );
});

// Sync pending data when connection is restored
async function syncPendingData() {
  try {
    // Check for pending class logs in IndexedDB
    const pendingClasses = await getPendingClasses();
    
    for (const classData of pendingClasses) {
      try {
        const response = await fetch('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(classData)
        });
        
        if (response.ok) {
          await removePendingClass(classData.id);
          console.log('Synced pending class:', classData.id);
        }
      } catch (err) {
        console.log('Failed to sync class:', err);
      }
    }
    
    // Clear API cache to get fresh data
    await caches.delete(API_CACHE_NAME);
  } catch (err) {
    console.log('Background sync failed:', err);
  }
}

// Helper functions for IndexedDB operations
async function getPendingClasses() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('jits-journal-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingClasses'], 'readonly');
      const store = transaction.objectStore('pendingClasses');
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => resolve(getRequest.result || []);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingClasses')) {
        db.createObjectStore('pendingClasses', { keyPath: 'id' });
      }
    };
  });
}

async function removePendingClass(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('jits-journal-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingClasses'], 'readwrite');
      const store = transaction.objectStore('pendingClasses');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

console.log('BJJ Journal Service Worker loaded successfully');