import { WebSocketServer } from 'ws';

export function attachWebSocket(server, game) {
    const wss = new WebSocketServer({ server });
    wss.on('connection', ws => {
        console.log('🟢 Cliente conectado ao WebSocket do jogo');

        const sendState = state => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: 'state', data: state }));
            }
        };

        sendState(game.state);
        
        game.on('state', sendState);

        ws.on('message', msg => {
            const { type, data } = JSON.parse(msg);
            if (type === 'control') game.control(data.player, data.action);
            else if (type === 'start') game.start();
        });

        ws.on('close', () => {
            game.removeListener('state', sendState);
        });
    });
}