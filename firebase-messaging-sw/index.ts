import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

declare const self: ServiceWorkerGlobalScope;

const firebaseApp = initializeApp({
  apiKey: 'AIzaSyBbwkLP-C61kWmzCq-pFdvSJXHHUjmoRK0',
  authDomain: 'mate-ba361.firebaseapp.com',
  projectId: 'mate-ba361',
  storageBucket: 'mate-ba361.firebasestorage.app',
  messagingSenderId: '996341622273',
  appId: '1:996341622273:web:f1a110eea9820b30ad8200',
  measurementId: 'G-1V0KFDFZTF'
});

const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, (payload) => {
  console.log('[SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Mate';
  const notificationOptions: NotificationOptions = {
    body: payload.notification?.body,
    icon: '/mate-app/icons/icon-192x192.png',
    badge: '/mate-app/icons/badge-72x72.png',
    data: payload.data,
    tag: 'mate-notification',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = (event.notification.data?.url as string) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});
