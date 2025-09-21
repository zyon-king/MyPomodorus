// sw.js - Versão com SDK Global do Appwrite

// 1. Importa o script do SDK para dentro do ambiente do Service Worker
importScripts('https://cdn.jsdelivr.net/npm/appwrite@20.0.0/dist/iife/sdk.js');

// 2. Inicializa o Appwrite (semelhante ao que fazemos na página)
const { Client, Functions } = self.Appwrite;

// !!! ATENÇÃO: PREENCHA SUAS INFORMAÇÕES AQUI !!!
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '686a67d5003a1b4b1bf9';
const DISPARAR_FUNCTION_ID = '68cf1fc2002e437c4272'; // Coloque o ID da sua função aqui

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const functions = new Functions(client);


// --- O RESTO DO CÓDIGO ---

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
        console.log('[SW] Hora do alarme! Chamando a função Appwrite via SDK...');
        
        // 3. Usa o SDK para executar a função, em vez do fetch
        functions.createExecution(
            DISPARAR_FUNCTION_ID,
            JSON.stringify({ // O corpo da requisição
                userId: userId,
                title: payload.title,
                body: payload.body,
            })
        )
        .then(response => {
            console.log('[SW] Função Appwrite executada com sucesso!', response);
        })
        .catch(error => {
            console.error('[SW] Erro ao executar função Appwrite:', error);
        });

      }, delay);
    }
  }
});

// Este código para receber o PUSH continua o mesmo
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
