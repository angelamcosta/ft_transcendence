import { fetch, Agent as UndiciAgent } from 'undici';

export default async function matchRoutes(app, opts) {
	const GAME_URL = process.env.GAME_URL;
	if (!GAME_URL) throw new Error('⛔️ Missing env GAME_URL');

	const tlsAgent = new UndiciAgent({ connect: { rejectUnauthorized: false } });

	app.get('/matches', async (req, reply) => {
		const res = await fetch(`${MATCHES_URL}/api/matches`, {
			dispatcher: tlsAgent, method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	});

	app.get('/tournaments', async (req, reply) => {
		const res = await fetch(`${MATCHES_URL}/api/tournaments`, {
			dispatcher: tlsAgent, method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	});

	app.post('/tournaments', async (req, reply) => {
		const res = await fetch(`${MATCHES_URL}/api/tournaments`, {
			dispatcher: tlsAgent, method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(req.body)
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	});

	app.post('/tournaments/:id/players', async (req, reply) => {
		const { id } = req.params;
		const res = await fetch(`${MATCHES_URL}/api/tournaments/${id}/players`, {
			dispatcher: tlsAgent, method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(req.body)
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	});

	app.get('/tournaments/:id/matches', async (req, reply) => {
		const { id } = req.params;
		const res = await fetch(`${MATCHES_URL}/api/tournaments/${id}/matches`, {
			dispatcher: tlsAgent, method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	});

	app.post('/matches/:id/result', async (req, reply) => {
		const { id } = req.params;
		const res = await fetch(`${MATCHES_URL}/api/matches/${id}/result`, {
			dispatcher: tlsAgent, method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(req.body)
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	});

	app.get('/matches/:id', async (req, reply) => {
		const { id } = req.params;
		const res = await fetch(`${MATCHES_URL}/api/matches/${id}`, {
			dispatcher: tlsAgent, method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	});

	app.delete('/matchmaking/leave', async (req, reply) => {
		const res = await fetch(`${MATCHES_URL}/api/matchmaking/leave`, {
			dispatcher: tlsAgent, method: 'DELETE'
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	});
	app.post('/matchmaking/join', async (req, reply) => {
		const res = await fetch(`${MATCHES_URL}/api/matchmaking/join`, {
			dispatcher: tlsAgent, method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(req.body)
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	});
}
