<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alarme de Inatividade</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f0f0;
            text-align: center;
        }
        .container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #333;
        }
        #status {
            margin-top: 20px;
            font-size: 1.2em;
            color: #555;
            min-height: 30px;
        }
        #countdown-display {
            font-size: 2.5em;
            font-weight: bold;
            color: #007bff;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Alarme de Inatividade</h1>
        <p>Monitorando sua atividade para o alarme de **<span id="alarm-time"></span>**.</p>
        <div id="status">Clique para iniciar...</div>
        <div id="countdown-display"></div>
    </div>

    <script>
// Define os horários dos alarmes
const alarmes = ["11:30", "12:30", "14:40", "14:50", "14:07", "14:39"]; // Formato HH:mm

const notificationSound = new Audio('https://github.com/akx/Notifications/raw/refs/heads/master/WAV/Enharpment.wav');

// Variáveis de controle
let intervaloNotificacaoId = null;
let contagemRegressivaEmMinutos = 0;
let intervaloContagemId = null;
let alarmeAtual = null;

function calcularTempoRestante(alarmeStr) {
    const [horas, minutos] = alarmeStr.split(':').map(Number);
    const agora = new Date();
    const alarmeDate = new Date();
    alarmeDate.setHours(horas, minutos, 0, 0);

    // Se o alarme for para um horário já passado hoje, ajusta para o dia seguinte
    if (alarmeDate.getTime() < agora.getTime()) {
        alarmeDate.setDate(alarmeDate.getDate() + 1);
    }

    const diferencaMs = alarmeDate.getTime() - agora.getTime();
    return Math.floor(diferencaMs / (1000 * 60));
}

function atualizarContagemRegressiva() {
    const agora = new Date();
    let tempoMinimo = Infinity;
    let alarmeProximo = null;

    alarmes.forEach(alarme => {
        const tempoRestante = calcularTempoRestante(alarme);
        if (tempoRestante < tempoMinimo) {
            tempoMinimo = tempoRestante;
            alarmeProximo = alarme;
        }
    });

    alarmeAtual = alarmeProximo;
    contagemRegressivaEmMinutos = tempoMinimo;
    document.getElementById('countdown-display').innerText = `Faltam ${contagemRegressivaEmMinutos} minutos para ${alarmeAtual}`;
}

function requestPermission() {
    if (!('Notification' in window)) {
        atualizarStatus('Este navegador não suporta notificações.');
        return;
    }
    
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('Permissão para notificações concedida.');
            atualizarStatus('Permissão concedida! O temporizador de inatividade está ativo.');
        } else {
            console.log('Permissão para notificações negada.');
            atualizarStatus('Permissão para notificações negada.');
        }
    });
}

function verificarInatividade() {
    if (intervaloNotificacaoId === null) {
        console.log('Limite de inatividade atingido. Começando a enviar notificações.');
        
        const titulo = "My Pomodorus";
        const corpo = "";
        
        // Envia a primeira notificação com a mensagem personalizada
        enviarNotificacao(titulo, corpo);

        // Agende o envio das próximas notificações a cada 1 minuto
        intervaloNotificacaoId = setInterval(() => {
        
            const titulo = "My Pomodorus";
            const corpo = "Clique em qualquer lugar da página para parar de receber notificações.";

            // Envia a segunda notificação com a mensagem personalizada
            enviarNotificacao(titulo, corpo);
        }, 60000); // 60000 milissegundos = 1 minuto
        
        atualizarStatus('Clique em qualquer lugar da página para parar de receber notificações.');
    }
}

// Código corrigido e simplificado
function enviarNotificacao(title, body) {
    if (Notification.permission === 'granted') {
        const notificacao = new Notification(title, {
            body: body,
            icon: "icon-192x192.png" // Opcional, mas recomendado
        });

        notificationSound.play();

        notificacao.onclick = function() {
            notificationSound.pause();
            notificationSound.currentTime = 0;

            // O navegador lida com o fechamento da notificação e o foco da janela automaticamente
            // A chamada a `notificacao.close()` aqui pode não ser necessária, mas não causa problemas
            notificacao.close();
        };

    } else {
        clearInterval(intervaloNotificacaoId);
        intervaloNotificacaoId = null;
        console.log('Permissão de notificação revogada. Parando o envio.');
        atualizarStatus('Permissão de notificação revogada. O envio foi interrompido.');
    }
}

function resetarContador() {
    console.log('Atividade detectada.');
    
    clearInterval(intervaloNotificacaoId);
    intervaloNotificacaoId = null;

    // Recalcula o tempo restante e reinicia o temporizador
    atualizarContagemRegressiva();
    const tempoEmMs = contagemRegressivaEmMinutos * 60000;
    
    // Limpa o temporizador anterior para evitar duplicações
    if (window.intervaloVerificacaoId) {
        clearTimeout(window.intervaloVerificacaoId);
    }
    
    window.intervaloVerificacaoId = setTimeout(verificarInatividade, tempoEmMs);
    console.log(`Próxima verificação em ${contagemRegressivaEmMinutos} minutos.`);
    atualizarStatus('Bem-vindo de volta! O contador de inatividade foi reiniciado.');
}

function atualizarStatus(mensagem) {
    document.getElementById('status').innerText = mensagem;           
                
    // Para o som quando o usuário interage
    notificationSound.pause();
    notificationSound.currentTime = 0;
}

function init() {
    console.log('DOM carregado. Iniciando script.');
    document.getElementById('alarm-time').innerText = alarmes.join(', ');
    requestPermission();
    
    document.addEventListener('click', resetarContador);
    document.addEventListener('keypress', resetarContador);

    atualizarContagemRegressiva();
    const tempoEmMs = contagemRegressivaEmMinutos * 60000;
    
    // Inicia a verificação uma única vez, no momento certo
    window.intervaloVerificacaoId = setTimeout(verificarInatividade, tempoEmMs); 
    console.log(`Verificação de inatividade agendada para daqui a ${contagemRegressivaEmMinutos} minutos.`);
    atualizarStatus('A página está monitorando sua atividade. Clique em qualquer lugar para reiniciar o contador.');
    
    // Atualiza a contagem regressiva a cada minuto para o usuário
    intervaloContagemId = setInterval(atualizarContagemRegressiva, 60000);
}

document.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>
