/**
 * Librika Service Worker for Multi-Device Web Push Notifications
 * Supports Phones (Android & iOS 16.4+ PWA) and Laptops/Desktops (macOS, Windows, Linux).
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming background push message from server
self.addEventListener('push', (event) => {
  let data = {
    title: 'Librika Alert',
    body: 'You have a new update in your library portal.',
    icon: '/logo.png',
    badge: '/favicon-32x32.png',
    url: '/student',
    tag: 'librika-notif'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: data.badge || '/favicon-32x32.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'librika-alert',
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || '/student',
      timestamp: data.timestamp || Date.now()
    },
    actions: [
      { action: 'open', title: 'Open Librika' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle user clicking the system notification on their phone or laptop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/student';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a Librika window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
