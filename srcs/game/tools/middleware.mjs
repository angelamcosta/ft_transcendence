import { WebSocketServer } from 'ws';
import { GameService } from './service.mjs';
const game = new GameService();

export function attachWebSocket(server) {
    const wss = new WebSocketServer({ server });
    wss.on('connection', ws => {
        const sendState = state => {
            if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'state', data: state }));
        };
        game.on('state', sendState);

        ws.on('message', msg => {
            const { type, data } = JSON.parse(msg);
            if (type === 'control') game.control(data.player, data.action);
            else if (type === 'start') game.start();
        });

        ws.on('close', () => game.removeListener('state', sendState));
    });
}