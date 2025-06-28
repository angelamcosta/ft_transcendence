import { fetch, Agent as UndiciAgent } from 'undici';
import WebSocket from 'ws';
import { authenticateRequest } from './chat.utils.mjs';

const GAME_URL = process.env.GAME_URL;
if (!GAME_URL) throw new Error('⛔️ Missing env GAME_URL');

const GAME_WS = GAME_URL.replace(/^http/, 'ws');
const tlsAgent = new UndiciAgent({ connect: { rejectUnauthorized: false } });

export default async function gameRoutes(app) {
    app.post('/api/game/init', async (req, reply) => {
        const res = await fetch(`${GAME_URL}/api/game/init`, { dispatcher: tlsAgent, method: 'POST' });
        const data = await res.json();
        return reply.code(res.status).send(data);
    });

    app.post('/api/game/start', async (req, reply) => {
        const res = await fetch(`${GAME_URL}/api/game/start`, { dispatcher: tlsAgent, method: 'POST' });
        const data = await res.json();
        return reply.code(res.status).send(data);
    });

    app.post('/api/game/control/:player/:action', async (req, reply) => {
        const { player, action } = req.params;
        const res = await fetch(`${GAME_URL}/api/game/control/${player}/${action}`, { dispatcher: tlsAgent, method: 'POST' });
        const data = await res.json();
        return reply.code(res.status).send(data);
    });

    app.get('/api/game/ws', { websocket: true, onRequest: authenticateRequest(app) }, (connection, req) => {
        const upstream = new WebSocket(GAME_WS, { rejectUnauthorized: false });

        upstream.on('message', msg => {
            connection.socket.send(msg);
        });

        connection.socket.on('message', buf => {
            upstream.send(buf);
        });

        const closeBoth = () => {
            upstream.close();
            connection.socket.close();
        };

        connection.socket.on('close', closeBoth);
        upstream.on('close', closeBoth);
    });
}
