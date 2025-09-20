// sw.js - Versão inteligente com agendamento local

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// O Service Worker recebe uma mensagem da sua página principal
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_ALARM') {
    const { userId, time, payload } = event.data;

    const targetTime = new Date(time).getTime();
    const now = Date.now();
    const delay = targetTime - now;

    if (delay > 0) {
      console.log(`[SW] Alarme agendado para tocar em ${delay / 1000} segundos.`);
      
      setTimeout(() => {
        console.log('[SW] Hora do alarme! Chamando a função Appwrite...');
        
        // Quando o tempo acabar, chama a função para disparar o Push
        fetch('URL_DA_SUA_FUNCAO', { // IMPORTANTE: Substitua a URL
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': 'SEU_PROJECT_ID', // IMPORTANTE: Substitua o ID
          },
          body: JSON.stringify({
            userId: userId,
            title: payload.title,
            body: payload.body,
          }),
        });
      }, delay);
    }
  }
});

// Este código abaixo continua o mesmo, para quando a notificação PUSH chegar
self.addEventListener('push', event => {
  const data = event.data.json();
  const title = data.title || 'Alarme';
  const options = {
    body: data.body || 'Sua pausa está chamando!',
    icon: 'icon-192x192.png',
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
