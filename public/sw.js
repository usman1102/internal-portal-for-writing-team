const CACHE_NAME = 'papersley-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-32.png',
  '/icon-16.png',
  '/favicon.ico'
];

// Notification queue for background sync
let notificationQueue = [];

// Install event - cache resources and skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - claim clients and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, return a basic offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);

  let notificationData = {
    title: 'Paper Slay Notification',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      taskId: null,
      type: 'general'
    }
  };

  // Parse push payload if available
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || payload.message || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: {
          taskId: payload.data?.taskId || null,
          type: payload.data?.type || 'general',
          url: payload.data?.url || '/',
          notificationId: payload.data?.notificationId || null
        }
      };
    } catch (error) {
      console.error('[SW] Error parsing push payload:', error);
    }
  }

  // Notification options
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    tag: notificationData.data.taskId ? `task-${notificationData.data.taskId}` : 'general',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'View Task',
        icon: '/icon-32.png'
      },
      {
        action: 'mark-read',
        title: 'Mark as Read',
        icon: '/icon-32.png'
      }
    ]
  };

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .then(() => {
        console.log('[SW] Notification shown successfully');
        // Add to queue for background sync if needed
        notificationQueue.push({
          ...notificationData,
          timestamp: Date.now()
        });
      })
      .catch((error) => {
        console.error('[SW] Error showing notification:', error);
      })
  );
});

// Notification click event - handle user interaction with notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);

  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;

  if (action === 'mark-read') {
    // Handle mark as read action
    event.waitUntil(
      markNotificationAsRead(notificationData.notificationId)
    );
    return;
  }

  // Handle view action or notification click
  let targetUrl = '/';
  
  if (notificationData.taskId) {
    targetUrl = `/tasks?taskId=${notificationData.taskId}`;
  } else if (notificationData.url) {
    targetUrl = notificationData.url;
  }

  // Focus existing window or open new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let client of clientList) {
          if (client.url.includes(self.location.origin)) {
            // Focus existing window and navigate
            return client.focus().then(() => {
              return client.postMessage({
                type: 'NAVIGATE',
                url: targetUrl,
                notificationData: notificationData
              });
            });
          }
        }
        
        // Open new window if no existing window found
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
      .catch((error) => {
        console.error('[SW] Error handling notification click:', error);
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  
  // Optional: Track notification dismissals
  const notificationData = event.notification.data || {};
  if (notificationData.notificationId) {
    // Could send analytics or update read status
    console.log('[SW] Notification dismissed:', notificationData.notificationId);
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

// Helper function to mark notification as read
async function markNotificationAsRead(notificationId) {
  if (!notificationId) return;
  
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      credentials: 'include'
    });
    
    if (response.ok) {
      console.log('[SW] Notification marked as read:', notificationId);
      
      // Notify all clients about the update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'NOTIFICATION_READ',
          notificationId: notificationId
        });
      });
    }
  } catch (error) {
    console.error('[SW] Error marking notification as read:', error);
  }
}

// Background sync for notifications
async function syncNotifications() {
  try {
    console.log('[SW] Syncing notifications...');
    
    // Process queued notifications
    const queue = [...notificationQueue];
    notificationQueue = [];
    
    for (const notification of queue) {
      // Could sync read status, analytics, etc.
      console.log('[SW] Processing queued notification:', notification);
    }
    
    // Fetch latest notifications if online
    if (navigator.onLine) {
      const response = await fetch('/api/notifications', {
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log('[SW] Notifications synced successfully');
      }
    }
  } catch (error) {
    console.error('[SW] Error syncing notifications:', error);
  }
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'NOTIFICATION_PERMISSION_GRANTED':
      console.log('[SW] Notification permission granted');
      break;
      
    case 'REGISTER_PUSH_SUBSCRIPTION':
      console.log('[SW] Push subscription registered');
      break;
      
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});