const { Client, Databases, Messaging, Query } = require('node-appwrite');

module.exports = async ({ res, log }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const messaging = new Messaging(client);

  const now = new Date().toISOString();

  try {
    // Busca por agendamentos cuja hora é menor ou igual à hora atual
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_COLLECTION_ID,
      [Query.lessThanEqual('targetTime', now)]
    );

    if (response.documents.length === 0) {
      log('Nenhum agendamento para enviar.');
      return res.json({ success: true, message: 'Nenhum agendamento.' });
    }

    log(`Encontrados ${response.documents.length} agendamentos para enviar.`);

    // Itera sobre cada agendamento encontrado
    for (const schedule of response.documents) {
      const payload = JSON.parse(schedule.payload);

      // Envia a notificação Push
      await messaging.createPush(
        'notification-' + schedule.$id, // ID único para a notificação
        payload.title,
        payload.body,
        [], // topics
        [schedule.userId] // users
      );
      
      log(`Notificação enviada para o usuário ${schedule.userId}`);

      // Apaga o documento para não ser enviado novamente
      await databases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_COLLECTION_ID,
        schedule.$id
      );
    }

    return res.json({ success: true, message: `${response.documents.length} notificações enviadas.` });

  } catch (error) {
    log(`Erro ao enviar agendamentos: ${error.message}`);
    return res.json({ success: false, message: 'Falha ao processar agendamentos.' }, 500);
  }
};
