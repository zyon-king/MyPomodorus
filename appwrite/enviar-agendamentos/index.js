const { Client, Messaging } = require('appwrite');

module.exports = async ({ req, res, log }) => {
  // Inicializa o cliente Appwrite
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const messaging = new Messaging(client);

  // Pega os dados enviados pelo Service Worker
  const { userId, title, body } = req.body;

  if (!userId || !title || !body) {
    return res.json({ success: false, message: 'userId, title e body são obrigatórios.' }, 400);
  }

  try {
    // Envia a notificação Push IMEDIATAMENTE
    await messaging.createPush(
      'immediate-notification-' + Date.now(), // ID único
      title,
      body,
      [],
      [userId]
    );
    
    log(`Notificação imediata enviada para o usuário ${userId}`);
    return res.json({ success: true });

  } catch (error) {
    log(`Erro ao enviar notificação: ${error.message}`);
    return res.json({ success: false, message: 'Falha ao enviar notificação.' }, 500);
  }
};
