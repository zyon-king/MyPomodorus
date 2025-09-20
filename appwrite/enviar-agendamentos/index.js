const { Client, Databases, Messaging, Query } = require('node-appwrite');

// Função auxiliar para criar uma pausa (delay)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async ({ res, log }) => {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const messaging = new Messaging(client);

    const now = new Date();
    const futureLimit = new Date(now.getTime() + 15 * 60 * 1000); // Pega a data de agora + 15 minutos

    try {
        const response = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_COLLECTION_ID,
            [
                Query.lessThanEqual('targetTime', futureLimit.toISOString()),
                Query.greaterThanEqual('targetTime', now.toISOString())
            ]
        );

        if (response.documents.length === 0) {
            log('Nenhum agendamento para os próximos 15 minutos.');
            return res.json({ success: true, message: 'Nenhum agendamento.' });
        }

        log(`Encontrados ${response.documents.length} agendamentos para os próximos 15 minutos.`);

        const promises = response.documents.map(async (schedule) => {
            const targetTime = new Date(schedule.targetTime);
            const delay = targetTime.getTime() - new Date().getTime();

            // Apaga o documento IMEDIATAMENTE para garantir que não será processado de novo
            await databases.deleteDocument(
                process.env.APPWRITE_DATABASE_ID,
                process.env.APPWRITE_COLLECTION_ID,
                schedule.$id
            );

            if (delay > 0) {
                await sleep(delay);
            }
            
            const payload = JSON.parse(schedule.payload);

            await messaging.createPush(
                'notification-' + schedule.$id,
                payload.title,
                payload.body,
                [],
                [schedule.userId]
            );

            log(`Notificação enviada para o usuário ${schedule.userId} após um delay de ${delay}ms.`);
        });

        // Espera todas as notificações agendadas nesta execução serem enviadas
        await Promise.all(promises);

        return res.json({ success: true, message: `${response.documents.length} notificações processadas.` });

    } catch (error) {
        log(`Erro ao processar agendamentos: ${error.message}`);
        return res.json({ success: false, message: 'Falha ao processar agendamentos.' }, 500);
    }
};
