import { fetch, Agent as UndiciAgent } from 'undici';

const AUTH_URL = process.env.AUTH_URL;
const tlsAgent = new UndiciAgent({
	connect: { rejectUnauthorized: false }
});

export default async function authRoutes(app) {

	app.post('/register', async (req, reply) => {
		try {
			const res = await fetch(`${AUTH_URL}/api/register`, {
				dispatcher: tlsAgent,
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(req.body),
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /register error:', e);
			return reply.code(500).send({ error: 'Server proxy error' });
		}
	});
	
	app.post('/login', async (req, reply) => {
		try {
			const res = await fetch(`${AUTH_URL}/api/login`, {
				dispatcher: tlsAgent,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					cookie: req.headers.cookie,
				},
				body: JSON.stringify(req.body),
			});
			const data = await res.json();
			const setCookie = res.headers.get('set-cookie');
			if (setCookie) reply.header('set-cookie', setCookie);
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /login error:', e);
			return reply.code(500).send({ error: 'Proxy error during login' });
		}
	});
	
	app.post('/logout', async (req, reply) => {
		try {
			const res = await fetch(`${AUTH_URL}/api/logout`, {
				dispatcher: tlsAgent,
				method: 'POST',
				headers: {
					cookie: req.headers.cookie,
				}
			});
			const data = await res.json();
			const setCookie = res.headers.get('set-cookie');
			if (setCookie) reply.header('set-cookie', setCookie);
			return reply.code(res.status).send(data)
		} catch (e) {
			console.error('Proxy /logout error:', e);
			return reply.code(500).send({ error: 'Proxy error during logout' });
		}
	});
	
	app.post('/set-2fa', async (req, reply) => {
		try {
			const res = await fetch(`${AUTH_URL}/api/set-2fa`, {
				dispatcher: tlsAgent,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					cookie: req.headers.cookie,
				},
				body: JSON.stringify(req.body),
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /set-2fa error:', e);
			return reply.code(500).send({ error: 'Error setting 2FA' });
		}
	});
	
	app.post('/verify-2fa', async (req, reply) => {
		try {
			const res = await fetch(`${AUTH_URL}/api/verify-2fa`, {
				dispatcher: tlsAgent,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					cookie: req.headers.cookie,
				},
				body: JSON.stringify(req.body),
			});
			const data = await res.json();
			const setCookie = res.headers.get('set-cookie');
			if (setCookie) reply.header('set-cookie', setCookie);
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /verify-2fa error:', e);
			return reply.code(500).send({ error: 'Error verifying 2FA' });
		}
	});
	
	app.get('/verify', async (req, reply) => {
		try {
			const res = await fetch(`${AUTH_URL}/api/verify`, {
				dispatcher: tlsAgent,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					cookie: req.headers.cookie,
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /verify error:', e);
			return reply.code(500).send({ error: 'Error verifying user' });
		}
	})
}