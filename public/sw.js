/* NakliYol Service Worker — Web Push bildirimleri */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  let veri = { baslik: 'NakliYol', icerik: '', ikon: '/icon-192.png', url: '/#/app' };
  try {
    if (event.data) veri = Object.assign(veri, event.data.json());
  } catch (e) {
    if (event.data) veri.icerik = event.data.text();
  }

  const options = {
    body: veri.icerik,
    icon: veri.ikon,
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: veri.url || '/#/app' },
    requireInteraction: veri.zorunlu !== false
  };

  event.waitUntil(self.registration.showNotification(veri.baslik || 'NakliYol', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const hedefUrl = (event.notification.data && event.notification.data.url) || '/#/app';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ tur: 'pushTik', url: hedefUrl });
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(hedefUrl);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.tur === 'skipWaitingYap') {
    self.skipWaiting();
  }
});
