// sw.js (Versão Final e Simples)

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// Apenas escuta o PUSH final e mostra a notificação
self.addEventListener('push', event => {
  const data = event.data.json();
  const title = data.title || 'Alarme My Pomodorus';
  const options = {
    body: data.body,
    icon: 'icon-192x192.png',
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
