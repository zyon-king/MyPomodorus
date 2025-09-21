const { Client, Messaging } = require('appwrite');

module.exports = async ({ req, res, log, error }) => {
    try {
        // Parse do body da requisição
        const { userId, title, body: messageBody } = JSON.parse(req.body || '{}');
        
        // Inicializar cliente Appwrite
        const client = new Client()
            .setEndpoint('https://nyc.cloud.appwrite.io/v1')
            .setProject('686a67d5003a1b4b1bf9')
            .setKey('standard_b6c8a89d9b80b56b29193f4e1514a9edb8099871c7449b264ab9f817608735d0fe1690f3906850f4d36dc6bea60bad4b6246b2459b1c5b8b9241203ebd4b590a318adb8a5146adb137d34ca6dd840eea162f1e612f4ba754dd849035699cd33d7092c6445333665a9429d1498f8adf16cf82c60244afdef86ef29a105c496476'); // Substitua pela sua API Key
        
        const messaging = new Messaging(client);
        
        // Enviar notificação push
        const result = await messaging.createPush(
            'unique-message-id-' + Date.now(), // ID único da mensagem
            title,
            messageBody,
            null, // topics (opcional)
            [userId], // users - array com o ID do usuário
            null, // targets (opcional)
            null, // data (opcional)
            null, // action (opcional)
            null, // icon (opcional)
            null, // sound (opcional)
            null, // color (opcional)
            null, // tag (opcional)
            null, // badge (opcional)
            null  // draft (opcional)
        );
        
        log('Notificação enviada com sucesso:', result);
        
        return res.json({
            success: true,
            messageId: result.$id
        });
        
    } catch (err) {
        error('Erro ao enviar notificação:', err);
        return res.json({
            success: false,
            error: err.message
        });
    }
};
