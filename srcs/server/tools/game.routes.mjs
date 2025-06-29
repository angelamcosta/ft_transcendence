import { fetch, Agent as UndiciAgent } from 'undici';
import WebSocket from 'ws';
import { Agent as HttpsAgent } from 'https';
import { authenticateRequest } from './chat.utils.mjs';

const GAME_URL = process.env.GAME_URL;
if (!GAME_URL) throw new Error('⛔️ Missing env GAME_URL');

const GAME_WS = `${GAME_URL.replace(/^https/, 'wss')}/api/game/ws`;
const wsAgent = new HttpsAgent({ rejectUnauthorized: false });

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
        console.log('➡️ Novo WebSocket do front conectado ao proxy');

        const upstream = new WebSocket(GAME_WS, {
            rejectUnauthorized: false,
            agent: wsAgent
        });

        upstream.on('open', () => {
            console.log('✅ Proxy conectado ao container game');

            connection.on('message', buf => {
                if (typeof buf === 'string')
                    upstream.send(buf);
                else
                    upstream.send(buf.toString());
            });

            upstream.on('message', msg => {
                if (typeof msg === 'string')
                    connection.send(msg);
                else
                    connection.send(msg.toString());
            });
        });

        const closeBoth = () => {
            console.log('🔌 Conexão encerrada');
            upstream.close();
            connection.close();
        };

        connection.on('close', closeBoth);
        upstream.on('close', closeBoth);

        upstream.on('error', (err) => {
            console.error('❌ Erro no WebSocket upstream:', err.message);
        });
    });
}
