import { fetch, Agent as UndiciAgent } from 'undici';
import WebSocket from 'ws';
import { Agent as HttpsAgent } from 'https';
import { authenticateRequest } from './chat.utils.mjs';

const tlsAgent = new UndiciAgent({
	connect: { rejectUnauthorized: false }
});

const GAME_URL = process.env.GAME_URL;
if (!GAME_URL) throw new Error('⛔️ Missing env GAME_URL');

const GAME_WS = `${GAME_URL.replace(/^https/, 'wss')}/api/game/wss`;
const wsAgent = new HttpsAgent({ rejectUnauthorized: false });

export default async function gameRoutes(app) {
	app.post('/game/create/:id', async (req, reply) => {
		const id = Number(req.params.id);

		const res = await fetch(`${GAME_URL}/api/game/create/${id}`, { dispatcher: tlsAgent, method: 'POST' });
		const data = await res.json();
		return reply.code(res.status).send(data);
	});

	app.post('/game/:id/init', async (req, reply) => {
		const id = Number(req.params.id);
		const res = await fetch(`${GAME_URL}/api/game/${id}/init`, { dispatcher: tlsAgent, method: 'POST' });
		const data = await res.json();
		return reply.code(res.status).send(data);
	});

	app.post('/game/:id/start', async (req, reply) => {
		const id = Number(req.params.id);
		const res = await fetch(`${GAME_URL}/api/game/${id}/start`, { dispatcher: tlsAgent, method: 'POST' });
		const data = await res.json();
		return reply.code(res.status).send(data);
	});

	app.post('/game/:id/control/:player/:action', async (req, reply) => {
		const { id, player, action } = req.params;
		const res = await fetch(`${GAME_URL}/api/game/${id}/control/${player}/${action}`, { dispatcher: tlsAgent, method: 'POST' });
		const data = await res.json();
		return reply.code(res.status).send(data);
	});

	app.post('/game/:id/boot', async (req, reply) => {
		const { id } = req.params;
		const res = await fetch(`${GAME_URL}/api/game/${id}/boot`, { dispatcher: tlsAgent, method: 'POST' });
		const data = await res.json();
		return reply.code(res.status).send(data);
	});

	app.get('/game/:id/boot', async (req, reply) => {
		const { id } = req.params;
		const res = await fetch(`${GAME_URL}/api/game/${id}/boot`, { dispatcher: tlsAgent, method: 'GET' });
		const data = await res.json();
		return reply.code(res.status).send(data);
	});

	app.get('/api/game/wss', { websocket: true, onRequest: authenticateRequest(app) }, (connection, req) => {
		const upstreamUrl = new URL(req.raw.url, GAME_WS).toString();
		const upstream = new WebSocket(upstreamUrl, {
			rejectUnauthorized: false,
			agent: wsAgent
		});

		let messageQueue = [];
		let isUpstreamOpen = false;

		connection.on('message', buf => {
			const data = buf.toString();

			if (isUpstreamOpen) {
				upstream.send(data);
			} else {
				messageQueue.push(data);
			}
		});

		upstream.on('open', () => {
			isUpstreamOpen = true;

			messageQueue.forEach(msg => upstream.send(msg));
			messageQueue = [];

			upstream.on('message', msg => {
				connection.send(msg);
			});
		});

		const closeBoth = () => {
			upstream.close();
			connection.close();
		};

		connection.on('close', closeBoth);
		upstream.on('close', closeBoth);

		upstream.on('error', (err) => {
			console.error('Erro no WebSocket upstream:', err.message);
			console.error('Detalhes do erro:', err);
		});
	});
}
