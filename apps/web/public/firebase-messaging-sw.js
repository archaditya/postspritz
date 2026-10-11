// Service Worker for PostSpritz Firebase Cloud Messaging (FCM)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDOKY-E-hj-4a59z8K2YiO0CrG5tWl0qGA',
  projectId: 'postspritz-media',
  messagingSenderId: '503594696871',
  appId: '1:503594696871:web:68538f95231154bc121b82',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'PostSpritz Notification';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'You have a new social syndication update.',
    icon: '/logos/icon-192.png',
    badge: '/favicons/favicon-32x32.png',
    data: {
      click_action: payload.data?.click_action || payload.fcmOptions?.link || '/dashboard',
      ...payload.data,
    },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickActionUrl = event.notification.data?.click_action || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(clickActionUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickActionUrl);
      }
    })
  );
});
