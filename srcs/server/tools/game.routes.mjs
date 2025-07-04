import { fetch } from 'undici';
import WebSocket from 'ws';
import { Agent as HttpsAgent } from 'https';
import { authenticateRequest } from './chat.utils.mjs';

export default async function gameRoutes(app, opts) {
    const GAME_URL = process.env.GAME_URL;
    if (!GAME_URL) throw new Error('⛔️ Missing env GAME_URL');

    const wsAgent = new HttpsAgent({ rejectUnauthorized: false });

    app.post('/:id/init', async (req, reply) => {
        const { id } = req.params;
        const res = await fetch(`${GAME_URL}/api/game/${id}/init`, {
            dispatcher: wsAgent, method: 'POST'
        });
        const data = await res.json();
        return reply.code(res.status).send(data);
    });

    app.post('/:id/start', async (req, reply) => {
        const { id } = req.params;
        const res = await fetch(`${GAME_URL}/api/game/${id}/start`, {
            dispatcher: wsAgent, method: 'POST'
        });
        const data = await res.json();
        return reply.code(res.status).send(data);
    });

    app.post('/:id/control/:player/:action', async (req, reply) => {
        const { id, player, action } = req.params;
        const res = await fetch(`${GAME_URL}/api/game/${id}/control/${player}/${action}`, {
            dispatcher: wsAgent, method: 'POST'
        });
        const data = await res.json();
        return reply.code(res.status).send(data);
    });

    app.get('/:id/wss', {
        websocket: true,
        onRequest: authenticateRequest(app)
    }, (connection, req) => {
        const { id } = req.params;
        const upstreamUrl = `${GAME_URL.replace(/^https/, 'wss')}/ws/${id}`;

        console.log('➡️ New WS proxy connection for gameId=', id);
        console.log('Connecting upstream to:', upstreamUrl);

        const upstream = new WebSocket(upstreamUrl, {
            rejectUnauthorized: false,
            agent: wsAgent
        });

        let queue = [];
        let open = false;

        connection.on('message', buf => {
            const msg = buf.toString();
            open ? upstream.send(msg) : queue.push(msg);
        });

        upstream.on('open', () => {
            open = true;
            queue.forEach(m => upstream.send(m));
            queue.length = 0;
            upstream.on('message', m => connection.send(m));
        });

        const closeBoth = () => {
            upstream.close();
            connection.close();
        };
        connection.on('close', closeBoth);
        upstream.on('close', closeBoth);
        upstream.on('error', err => console.error('Upstream WS error:', err));
    });
}
