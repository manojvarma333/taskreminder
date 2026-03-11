const CACHE_NAME = 'task-reminder-v2';

// Install service worker
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push notification handler
self.addEventListener('push', event => {
  console.log('Push message received:', event);
  
  let notificationData = {
    title: 'Task Reminder',
    body: 'You have a task reminder!',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: 'task-reminder',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/vite.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/vite.svg'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        body: data.body || notificationData.body,
        title: data.title || notificationData.title
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event);
});

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', event => {
  console.log('Push subscription changed:', event);
});

// Background sync for offline support
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  console.log('Background sync initiated');
  // Add any background sync logic here
}
