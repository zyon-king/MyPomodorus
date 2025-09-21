const { Client, Messaging } = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
    try {
        // Parse correto do body
        const data = JSON.parse(req.body || '{}');
        
        let userId, title, messageBody;
        
        // Verificar se é chamada direta ou via scheduler
        if (data.payload) {
            // Vem do scheduler
            userId = data.userId;
            title = data.payload.title;
            messageBody = data.payload.body;
        } else {
            // Chamada direta para teste
            userId = data.userId;
            title = data.title;
            messageBody = data.body;
        }
        
        // Debug
        log(`userId: ${userId}`);
        log(`title: ${title}`);
        log(`body: ${messageBody}`);
        
        if (!title) {
            error('Title está vazio ou undefined');
            return res.json({ success: false, error: 'Title é obrigatório' }, 400);
        }
        
        // Resto da função permanece igual
        const client = new Client()
            .setEndpoint('https://nyc.cloud.appwrite.io/v1')
            .setProject('686a67d5003a1b4b1bf9')
            .setKey('sua_api_key');
        
        const messaging = new Messaging(client);
        
        const result = await messaging.createPush(
            'unique-message-id-' + Date.now(),
            title,
            messageBody,
            null,
            [userId],
            null, null, null, null, null, null, null, null, null
        );
        
        log('Notificação enviada com sucesso:', result);
        return res.json({ success: true, messageId: result.$id });
        
    } catch (err) {
        error('Erro ao enviar notificação:', err);
        return res.json({ success: false, error: err.message });
    }
};
