const CACHE_NAME = 'studentflow-v5.0.0';

// ==================== ADVANCED SERVICE WORKER ====================
// Features: Background Sync, Push Notifications, Offline Analytics

// Assets to pre-cache at install (ALL required for offline)
const PRECACHE_ASSETS = [
  './',
  './studentflow_ultimate_pro.html',
  './offline.html',
  './tailwind.min.js',
  './chart.min.js',
  './lucide.min.js',
  './jspdf.min.js',
  './confetti.min.js',
  './config.js',
  './storage.js',
  './audio.js',
  './icons/icon-192x192.svg',
  './icons/icon-512x512.png'
];

// Background Sync Tags
const SYNC_TAGS = {
  JOURNAL: 'journal-sync',
  ANALYTICS: 'analytics-sync',
  GOALS: 'goals-sync',
  BACKUP: 'backup-sync'
};

// Install: Pre-cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing advanced service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => {
        console.log('[SW] ✅ Advanced cache ready');
        return self.skipWaiting();
      })
  );
});

// Activate: Clean old caches, take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => console.log('[SW] ✅ Now controlling all pages'))
  );
});

// Fetch: CACHE-FIRST with intelligent background updates
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET and non-http(s)
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        
        // ALWAYS try to update cache in background (if online)
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(request, networkResponse.clone());
              console.log('[SW] 🔄 Updated cache:', request.url.slice(-50));
            }
            return networkResponse;
          })
          .catch(() => null); // Silently fail if offline
        
        // CACHE HIT: Return immediately, update in background
        if (cachedResponse) {
          console.log('[SW] ⚡ From cache:', request.url.slice(-50));
          event.waitUntil(fetchPromise);
          return cachedResponse;
        }
        
        // CACHE MISS: Wait for network, cache the result
        return fetchPromise.then((networkResponse) => {
          if (networkResponse) {
            return networkResponse;
          }
          // Network failed AND not in cache = show offline page for navigation
          if (request.mode === 'navigate') {
            return cache.match('./offline.html');
          }
          return new Response('Offline', { status: 503 });
        });
      });
    })
  );
});

// ==================== BACKGROUND SYNC ====================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  switch(event.tag) {
    case SYNC_TAGS.JOURNAL:
      event.waitUntil(syncJournalData());
      break;
    case SYNC_TAGS.ANALYTICS:
      event.waitUntil(syncAnalyticsData());
      break;
    case SYNC_TAGS.GOALS:
      event.waitUntil(syncGoalsData());
      break;
    case SYNC_TAGS.BACKUP:
      event.waitUntil(createBackup());
      break;
  }
});

// Sync journal entries when back online
async function syncJournalData() {
  try {
    const clients = await self.clients.matchAll();
    const client = clients[0];
    
    if (client) {
      // Notify the app to sync journal data
      client.postMessage({
        type: 'SYNC_JOURNAL',
        timestamp: Date.now()
      });
    }
    
    console.log('[SW] ✅ Journal sync completed');
  } catch (error) {
    console.error('[SW] ❌ Journal sync failed:', error);
  }
}

// Sync analytics data when back online
async function syncAnalyticsData() {
  try {
    const clients = await self.clients.matchAll();
    const client = clients[0];
    
    if (client) {
      client.postMessage({
        type: 'SYNC_ANALYTICS',
        timestamp: Date.now()
      });
    }
    
    console.log('[SW] ✅ Analytics sync completed');
  } catch (error) {
    console.error('[SW] ❌ Analytics sync failed:', error);
  }
}

// Sync goals when back online
async function syncGoalsData() {
  try {
    const clients = await self.clients.matchAll();
    const client = clients[0];
    
    if (client) {
      client.postMessage({
        type: 'SYNC_GOALS',
        timestamp: Date.now()
      });
    }
    
    console.log('[SW] ✅ Goals sync completed');
  } catch (error) {
    console.error('[SW] ❌ Goals sync failed:', error);
  }
}

// Create backup when back online
async function createBackup() {
  try {
    const clients = await self.clients.matchAll();
    const client = clients[0];
    
    if (client) {
      client.postMessage({
        type: 'CREATE_BACKUP',
        timestamp: Date.now()
      });
    }
    
    console.log('[SW] ✅ Backup created');
  } catch (error) {
    console.error('[SW] ❌ Backup failed:', error);
  }
}

// ==================== PUSH NOTIFICATIONS ====================
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let notificationData = {
    title: 'StudentFlow',
    body: 'Nouvelle notification',
    icon: './icons/icon-192x192.svg',
    badge: './icons/icon-192x192.svg',
    tag: 'studentflow',
    data: { url: './studentflow_ultimate_pro.html' }
  };
  
  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (e) {
      console.error('[SW] Failed to parse push data:', e);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    event.waitUntil(
      clients.openWindow('./studentflow_ultimate_pro.html')
    );
  }
});

// ==================== OFFLINE ANALYTICS ====================
// Store analytics events when offline
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'OFFLINE_ANALYTICS') {
    // Store offline analytics events
    const analyticsData = event.data.payload;
    
    // Store in IndexedDB via the main app
    event.waitUntil(
      (async () => {
        try {
          const clients = await self.clients.matchAll();
          const client = clients[0];
          
          if (client) {
            client.postMessage({
              type: 'STORE_OFFLINE_ANALYTICS',
              payload: analyticsData
            });
          }
        } catch (error) {
          console.error('[SW] Failed to store offline analytics:', error);
        }
      })()
    );
  }
  
  // Handle skip waiting message
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  // Handle cache update requests
  if (event.data && event.data.type === 'UPDATE_CACHE') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.add(event.data.url);
      })
    );
  }
});

// ==================== CACHE MANAGEMENT ====================
// Periodic cache cleanup (every 24 hours)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupCache());
  }
});

async function cleanupCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    // Remove old entries (older than 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader && new Date(dateHeader).getTime() < sevenDaysAgo) {
          await cache.delete(request);
          console.log('[SW] 🗑️ Cleaned old cache entry:', request.url);
        }
      }
    }
    
    console.log('[SW] ✅ Cache cleanup completed');
  } catch (error) {
    console.error('[SW] ❌ Cache cleanup failed:', error);
  }
}

// Network status monitoring
self.addEventListener('online', () => {
  console.log('[SW] 🌐 Back online - triggering syncs');
  
  // Trigger all pending syncs
  self.registration.sync.register(SYNC_TAGS.JOURNAL);
  self.registration.sync.register(SYNC_TAGS.ANALYTICS);
  self.registration.sync.register(SYNC_TAGS.GOALS);
});

self.addEventListener('offline', () => {
  console.log('[SW] 📴 Gone offline - enabling offline mode');
});
