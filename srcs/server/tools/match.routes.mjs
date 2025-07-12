import { fetch, Agent as UndiciAgent } from 'undici';

const MATCHES_URL = process.env.MATCHES_URL;
const tlsAgent = new UndiciAgent({
	connect: { rejectUnauthorized: false }
});

export default async function matchRoutes(app) {
	app.get('/matches', async (req, reply) => {
		try {
			const res = await fetch(`${MATCHES_URL}/api/matches`, {
				dispatcher: tlsAgent,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /matches error:', e);
			return reply.code(500).send({ error: 'Error getting matches' });
		}
	})

	app.get('/tournaments', async (req, reply) => {
		try {
			const res = await fetch(`${MATCHES_URL}/api/tournaments`, {
				dispatcher: tlsAgent,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /matches error:', e);
			return reply.code(500).send({ error: 'Error getting matches' });
		}
	})

	app.post('/tournaments', async (req, reply) => {
		try {
			const res = await fetch(`${MATCHES_URL}/api/tournaments`, {
				dispatcher: tlsAgent,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					cookie: req.headers.cookie
				},
				body: JSON.stringify(req.body),
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /tournaments error:', e);
			return reply.code(500).send({ error: 'Error creating tournament' });
		}
	})

	app.delete('/tournaments/:id', async (req, reply) => {
		try {
			const t_id = req.params.id;
			const res = await fetch(`${MATCHES_URL}/api/tournaments/${t_id}`, {
				dispatcher: tlsAgent,
				method: 'DELETE',
				headers: {
					cookie: req.headers.cookie,
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (err) {
			console.error('Proxy /tournaments/:id error:', e);
			return reply.code(500).send({ error: 'Error deleting tournament' });
		}
	})

	app.post('/tournaments/:id/players', async (req, reply) => {
		try {
			const t_id = req.params.id;
			const res = await fetch(`${MATCHES_URL}/api/tournaments/${t_id}/players`, {
				dispatcher: tlsAgent,
				method: 'POST',
				headers: {
					cookie: req.headers.cookie,
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /tournaments/:id/players error:', e);
			return reply.code(500).send({ error: 'Error adding player to tournament' });
		}
	})

	app.get('/tournaments/:id/matches', async (req, reply) => {
		try {
			const t_id = req.params.id;
			const res = await fetch(`${MATCHES_URL}/api/tournaments/${t_id}/matches`, {
				dispatcher: tlsAgent,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /tournaments/:id/matches error:', e);
			return reply.code(500).send({ error: 'Error getting tournament matches' });
		}
	})

	app.post('/matches/:id/result', async (req, reply) => {
		try {
			const t_id = req.params.id;
			const res = await fetch(`${MATCHES_URL}/api/matches/${t_id}/result`, {
				dispatcher: tlsAgent,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(req.body),
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /matches/:id/result error:', e);
			return reply.code(500).send({ error: 'Error posting match result' });
		}
	})

	app.get('/matches/:id', async (req, reply) => {
		try {
			const t_id = req.params.id;
			const res = await fetch(`${MATCHES_URL}/api/matches/${t_id}`, {
				dispatcher: tlsAgent,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /matches/:id/ error:', e);
			return reply.code(500).send({ error: 'Error getting matches' });
		}
	})

	app.get('/matches/pending', async (req, reply) => {
		try {
			const res = await fetch(`${MATCHES_URL}/api/matches/pending`, {
				dispatcher: tlsAgent,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					cookie: req.headers.cookie
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /matches/pending error:', e);
			return reply.code(500).send({ error: 'Error getting pending matches' });
		}
	})

	app.get('/tournaments/wins/:id', async (req, reply) => {
		try {
			const t_id = req.params.id;
			const res = await fetch(`${MATCHES_URL}/api/tournaments/wins/${t_id}`, {
				dispatcher: tlsAgent,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					cookie: req.headers.cookie
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /tournaments/wins error:', e);
			return reply.code(500).send({ error: 'Error getting tournament wins' });
		}
	});

	app.delete('/matchmaking/leave', async (req, reply) => {
		try {
			const res = await fetch(`${MATCHES_URL}/api/matchmaking/leave`, {
				dispatcher: tlsAgent,
				method: 'DELETE',
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /matchmaking/leave error', e);
			return reply.code(500).send({ error: 'Error leaving matchmaking' });
		}
	})

	app.post('/matchmaking/join', async (req, reply) => {
		try {
			const res = await fetch(`${MATCHES_URL}/api/matchmaking/join`, {
				dispatcher: tlsAgent,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(req.body),
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /matchmaking/leave error', e);
			return reply.code(500).send({ error: 'Error leaving matchmaking' });
		}
	})

}
