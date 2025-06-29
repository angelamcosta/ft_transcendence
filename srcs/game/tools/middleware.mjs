import { WebSocketServer } from 'ws';

export function attachWebSocket(server, game) {
    const wss = new WebSocketServer({ server });
    wss.on('connection', ws => {
        console.log('🟢 Cliente conectado ao WebSocket do jogo');

        const sendState = state => { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'state', data: state })); };

        sendState(game.state);

        game.on('state', sendState);

        ws.on('message', msg => {
            let data;
            if (msg instanceof Buffer) {
                data = JSON.parse(msg.toString());
            } else if (typeof msg === 'string') {
                data = JSON.parse(msg);
            } else {
                console.error('Formato de mensagem não suportado:', msg);
                return;
            }

            const { type, data: payload } = data;
            if (type === 'control') game.control(payload.player, payload.action);
            else if (type === 'start') game.start();
        });

        ws.on('close', () => {
            game.removeListener('state', sendState);
        });
    });
}