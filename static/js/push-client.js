/**
 * Librika Push Notification Client helper for Web Browsers
 */
async function initWebPushNotifications() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.log('[WebPush] Push notifications not supported on this browser.');
    return;
  }

  try {
    // Register Service Worker
    const registration = await navigator.serviceWorker.register('/static/firebase-messaging-sw.js');
    console.log('[WebPush] Service worker registered with scope:', registration.scope);

    // Request Notification Permission
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[WebPush] Notification permission granted.');
      // Retrieve or generate token (if firebase client sdk is loaded)
      if (window.firebase && firebase.messaging) {
        const messaging = firebase.messaging();
        const currentToken = await messaging.getToken({ serviceWorkerRegistration: registration });
        if (currentToken) {
          console.log('[WebPush] FCM Web Token:', currentToken);
          await registerTokenWithServer(currentToken, 'web');
        }
      }
    }
  } catch (err) {
    console.warn('[WebPush] Error initializing web push:', err);
  }
}

async function registerTokenWithServer(token, deviceType) {
  try {
    const res = await fetch('/api/v1/devices/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcm_token: token, device_type: deviceType })
    });
    const data = await res.json();
    console.log('[WebPush] Server registration result:', data);
  } catch (e) {
    console.error('[WebPush] Server registration failed:', e);
  }
}

// Auto-run if user logged in
document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.loggedIn === 'true') {
    initWebPushNotifications();
  }
});
