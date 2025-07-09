import { WebSocketServer } from 'ws';

export async function validateEmptyBody(res, rep) {
    if (res.raw.method !== 'POST') return;

    const body = res.body;

    if (body === undefined || Object.keys(body).length === 0)
        return rep.code(400).send({ error: 'JSON body is empty' });
}

export function attachWebSocket(server, game) {
    const wss = new WebSocketServer({ server });
    wss.on('connection', ws => {
        console.log('🟢 Cliente conectado ao WebSocket do jogo');

        const sendState = state => { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'state', data: state })); };

        sendState(game.state);

        game.on('state', sendState);

        ws.on('message', msg => {
            console.log('📥 Mensagem recebida do proxy:', msg.toString());

            let data;
            try {
                if (msg instanceof Buffer) data = JSON.parse(msg.toString());
                else if (typeof msg === 'string') data = JSON.parse(msg);
                else return;

                console.log('Dados parseados:', data);
            } catch (err) {
                console.error('Erro ao parsear mensagem:', err);
                return;
            }

            const { type, data: payload } = data;
            if (type === 'control') game.control(payload.player, payload.action);
            else if (type === 'start') game.start();
            else if (type === 'stop') game.stop();
        });

        ws.on('close', () => {
            game.removeListener('state', sendState);
            game.stop();
        });
    });
}