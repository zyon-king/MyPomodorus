/**
 * Service Worker para o My Pomodorus
 */

// Evento 'install': Acionado quando o Service Worker é registrado pela primeira vez.
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalado com sucesso!');
  
  // Força o novo Service Worker a se tornar ativo imediatamente,
  // garantindo que as atualizações sejam aplicadas rapidamente.
  self.skipWaiting();
});

// Evento 'activate': Acionado quando o Service Worker se torna ativo.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativado com sucesso!');
  // Garante que o Service Worker controle a página imediatamente.
  return self.clients.claim();
});

// Evento 'push': É aqui que a mágica acontece.
// Acionado sempre que uma notificação push é recebida do servidor.
self.addEventListener('push', event => {
  console.log('[Service Worker] Notificação Push recebida!');

  // Os dados enviados pela nossa Função Appwrite chegam aqui.
  // Esperamos um JSON com 'title' e 'body'.
  const data = event.data.json();

  const title = data.title || 'Alarme My Pomodorus';
  const options = {
    body: data.body || 'Sua pausa programada está chamando!',
    icon: 'icon-192x192.png', // IMPORTANTE: Crie um ícone com este nome e tamanho
    badge: 'badge-72x72.png',    // IMPORTANTE: Crie um ícone menor para a barra de status
    vibrate: [200, 100, 200, 100, 200], // Padrão de vibração para chamar a atenção
  };

  // Pede ao navegador para não encerrar o Service Worker
  // até que a notificação seja completamente exibida.
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Evento 'notificationclick': Opcional, mas muito útil.
// Define o que acontece quando o usuário clica na notificação.
self.addEventListener('notificationclick', event => {
  // Fecha a notificação que foi clicada.
  event.notification.close();

  // Tenta focar em uma aba já aberta do site.
  // Se não houver nenhuma, abre uma nova aba.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
