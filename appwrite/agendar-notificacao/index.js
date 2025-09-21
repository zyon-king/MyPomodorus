//agendar-notificacao/index.js

const { Client, Databases, ID } = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
    // Inicializa o cliente Appwrite usando as Variáveis de Ambiente
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY); // Pega a chave segura das variáveis

    const databases = new Databases(client);

    try {
        const body = JSON.parse(req.body || '{}');
        const { userId, targetTime, payload } = body;

        if (!userId || !targetTime || !payload) {
            return res.json({ success: false, message: 'userId, targetTime, e payload são obrigatórios.' }, 400);
        }

        // Cria o documento na coleção de agendamentos
        await databases.createDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_COLLECTION_ID,
            ID.unique(),
            {
                userId: userId,
                targetTime: targetTime,
                payload: JSON.stringify(payload),
            }
        );

        log(`Agendamento criado para o usuário ${userId} às ${targetTime}`);
        return res.json({ success: true, message: 'Notificação agendada com sucesso.' });

    } catch (err) {
        error(`Erro ao agendar notificação: ${err.message}`);
        return res.json({ success: false, error: err.message }, 500);
    }
};
