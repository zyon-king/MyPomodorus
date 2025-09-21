const { Client, Databases, Messaging, Query } = require('node-appwrite');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async ({ res, log }) => {
    // Debug das variáveis de ambiente
    log(`APPWRITE_ENDPOINT: ${process.env.APPWRITE_ENDPOINT}`);
    log(`APPWRITE_PROJECT_ID: ${process.env.APPWRITE_PROJECT_ID}`);
    log(`APPWRITE_DATABASE_ID: ${process.env.APPWRITE_DATABASE_ID}`);
    log(`APPWRITE_COLLECTION_ID: ${process.env.APPWRITE_COLLECTION_ID}`);
    log(`APPWRITE_API_KEY: ${process.env.APPWRITE_API_KEY ? '[DEFINIDA]' : '[NÃO DEFINIDA]'}`);
    
    // Verificar se todas as variáveis necessárias estão definidas
    if (!process.env.APPWRITE_COLLECTION_ID) {
        log('ERRO: APPWRITE_COLLECTION_ID não está definida');
        return res.json({ success: false, message: 'Configuração incompleta: COLLECTION_ID' }, 500);
    }
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const messaging = new Messaging(client);

    const now = new Date();
    const futureLimit = new Date(now.getTime() + 15 * 60 * 1000);

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
            log(`Notificação enviada para ${schedule.userId} após ${delay}ms.`);
        });

        await Promise.all(promises);
        return res.json({ success: true, message: `${response.documents.length} notificações processadas.` });

    } catch (error) {
        log(`Erro ao processar agendamentos: ${error.message}`);
        return res.json({ success: false, message: 'Falha ao processar agendamentos.' }, 500);
    }
};
