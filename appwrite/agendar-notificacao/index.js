// agendar-notificacao
const { Client, Databases, ID } = require('appwrite');

module.exports = async ({ req, res, log }) => {
  // Validação de entrada
  if (!req.body.userId || !req.body.targetTime || !req.body.payload) {
    return res.json({ success: false, message: 'userId, targetTime, e payload são obrigatórios.' }, 400);
  }

  const { userId, targetTime, payload } = req.body;

  // Inicializa o SDK do Appwrite
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    // Cria um documento na coleção de agendamentos
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_COLLECTION_ID,
      ID.unique(),
      {
        userId: userId,
        targetTime: targetTime, // Ex: "2025-09-20T22:15:00.000Z" (formato ISO 8601 UTC)
        payload: JSON.stringify(payload), // Garante que o payload seja uma string JSON
      }
    );

    log(`Agendamento criado para o usuário ${userId} às ${targetTime}`);
    return res.json({ success: true, message: 'Notificação agendada com sucesso.' });

  } catch (error) {
    log(`Erro ao agendar notificação: ${error.message}`);
    return res.json({ success: false, message: 'Falha ao agendar notificação.' }, 500);
  }
};
