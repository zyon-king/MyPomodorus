const { Client, Databases, Messaging, Query } = require('node-appwrite');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async ({ req, res, log, error }) => {
    try {
        // Debug das variáveis de ambiente
        log(`APPWRITE_ENDPOINT: ${process.env.APPWRITE_ENDPOINT}`);
        log(`APPWRITE_PROJECT_ID: ${process.env.APPWRITE_PROJECT_ID}`);
        log(`APPWRITE_DATABASE_ID: ${process.env.APPWRITE_DATABASE_ID}`);
        log(`APPWRITE_COLLECTION_ID: ${process.env.APPWRITE_COLLECTION_ID}`);
        log(`APPWRITE_API_KEY: ${process.env.APPWRITE_API_KEY ? '[DEFINIDA]' : '[NÃO DEFINIDA]'}`);
        
        // Verificar se todas as variáveis necessárias estão definidas
        const requiredEnvVars = [
            'APPWRITE_ENDPOINT',
            'APPWRITE_PROJECT_ID', 
            'APPWRITE_DATABASE_ID',
            'APPWRITE_COLLECTION_ID',
            'APPWRITE_API_KEY'
        ];
        
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                error(`ERRO: ${envVar} não está definida`);
                return res.json({ 
                    success: false, 
                    message: `Configuração incompleta: ${envVar} não definida` 
                }, 500);
            }
        }

        // Inicializar cliente Appwrite
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT)
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        const databases = new Databases(client);
        const messaging = new Messaging(client);

        // Definir janela de tempo (próximos 15 minutos)
        const now = new Date();
        const futureLimit = new Date(now.getTime() + 15 * 60 * 1000);
        
        log(`Buscando agendamentos entre ${now.toISOString()} e ${futureLimit.toISOString()}`);

        // Buscar documentos que precisam ser processados
        const response = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_COLLECTION_ID,
            [
                Query.lessThanEqual('targetTime', futureLimit.toISOString()),
                Query.greaterThanEqual('targetTime', now.toISOString()),
                Query.orderAsc('targetTime') // Processar em ordem cronológica
            ]
        );

        if (response.documents.length === 0) {
            log('Nenhum agendamento para os próximos 15 minutos.');
            return res.json({ 
                success: true, 
                message: 'Nenhum agendamento encontrado.',
                processed: 0
            });
        }

        log(`Encontrados ${response.documents.length} agendamentos para processar.`);

        // Processar cada agendamento
        let processedCount = 0;
        let errorCount = 0;

        for (const schedule of response.documents) {
            try {
                const targetTime = new Date(schedule.targetTime);
                const delay = Math.max(0, targetTime.getTime() - new Date().getTime());
                
                log(`Processando agendamento ${schedule.$id} - Delay: ${delay}ms`);

                // Remover o documento da collection primeiro para evitar duplicação
                try {
                    await databases.deleteDocument(
                        process.env.APPWRITE_DATABASE_ID,
                        process.env.APPWRITE_COLLECTION_ID,
                        schedule.$id
                    );
                    log(`Documento ${schedule.$id} removido da collection`);
                } catch (deleteError) {
                    error(`Erro ao deletar documento ${schedule.$id}: ${deleteError.message}`);
                    // Continue mesmo se não conseguir deletar
                }

                // Aguardar até o momento correto (se necessário)
                if (delay > 0) {
                    log(`Aguardando ${delay}ms para enviar notificação...`);
                    await sleep(delay);
                }

                // Parsear o payload
                let payload;
                try {
                    payload = typeof schedule.payload === 'string' 
                        ? JSON.parse(schedule.payload) 
                        : schedule.payload;
                } catch (parseError) {
                    error(`Erro ao parsear payload do documento ${schedule.$id}: ${parseError.message}`);
                    errorCount++;
                    continue;
                }

                // Enviar notificação push
                try {
                    const pushResult = await messaging.createPush(
                        `notification-${schedule.$id}-${Date.now()}`, // ID único para evitar conflitos
                        payload.title || 'Notificação',
                        payload.body || 'Você tem uma notificação pendente',
                        [], // topics (vazio)
                        [schedule.userId], // users
                        [], // targets (vazio)
                        payload.data || null, // data adicional
                        payload.action || null, // action
                        payload.icon || null, // icon
                        payload.sound || null, // sound
                        payload.color || null, // color
                        payload.tag || null, // tag
                        payload.badge || null // badge
                    );

                    log(`✅ Notificação enviada com sucesso para ${schedule.userId} - Push ID: ${pushResult.$id}`);
                    processedCount++;

                } catch (messagingError) {
                    error(`❌ Erro ao enviar notificação para ${schedule.userId}: ${messagingError.message}`);
                    errorCount++;
                }

            } catch (scheduleError) {
                error(`Erro ao processar agendamento ${schedule.$id}: ${scheduleError.message}`);
                errorCount++;
            }
        }

        // Retornar resultado final
        const result = {
            success: true,
            message: `Processamento concluído. ${processedCount} notificações enviadas com sucesso.`,
            processed: processedCount,
            errors: errorCount,
            total: response.documents.length
        };

        log(`📊 Resultado final: ${JSON.stringify(result)}`);
        return res.json(result);

    } catch (mainError) {
        error(`❌ Erro crítico na função: ${mainError.message}`);
        error(`Stack trace: ${mainError.stack}`);
        
        return res.json({ 
            success: false, 
            message: `Erro crítico: ${mainError.message}`,
            processed: 0,
            errors: 1
        }, 500);
    }
};
