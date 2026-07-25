// Service Worker for Firebase Cloud Messaging (Web Push Notifications)
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSy_LIBRIKA_DEMO_KEY",
  authDomain: "librika-edtech.firebaseapp.com",
  projectId: "librika-edtech",
  storageBucket: "librika-edtech.appspot.com",
  messagingSenderId: "100000000000",
  appId: "1:100000000000:web:abcdef1234567890"
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification ? payload.notification.title : 'Librika Alert';
  const notificationOptions = {
    body: payload.notification ? payload.notification.body : 'New message received',
    icon: '/static/icons/icon-192x192.png',
    badge: '/static/icons/icon-72x72.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
