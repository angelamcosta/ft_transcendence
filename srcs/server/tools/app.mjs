import fs from 'fs';
import path from 'path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fetch, Agent as UndiciAgent } from 'undici';

const __dirname = new URL('.', import.meta.url).pathname;
const KEY_PATH = process.env.SERVER_KEY || 'key.pem';
const CERT_PATH = process.env.SERVER_CERT || 'cert.pem';
const PORT = process.env.SERVER_PORT || 9000;
const AUTH_URL = process.env.AUTH_URL;
const USER_URL = process.env.USER_URL;

const tlsAgent = new UndiciAgent({
  connect: { rejectUnauthorized: false }
});

const app = Fastify({
	logger: true,
	ignoreTrailingSlash: true,
	https: {
		key: fs.readFileSync(path.join(__dirname, KEY_PATH)),
		cert: fs.readFileSync(path.join(__dirname, CERT_PATH)),
	},
});

await app.register(cors, {
	origin: true,
	credentials: true,
});

['SIGINT', 'SIGTERM'].forEach(sig =>
	process.on(sig, async () => {
		await app.close();
		process.exit(0);
	})
);

app.get('/', async () => ({ message: 'Success!' }));

app.post('/register', async (req, reply) => {
	try {
		const res = await fetch(`${AUTH_URL}/register`, {
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
		const res = await fetch(`${AUTH_URL}/login`, {
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
		const res = await fetch(`${AUTH_URL}/logout`, { 
			dispatcher: tlsAgent,
			method: 'POST'
		});
		const data = await res.json();
		reply
			.header('set-cookie', 'auth=; Path=/; HttpOnly; Secure; Max-Age=0; SameSite=Strict')
			.code(res.status)
			.send(data);
	} catch (e) {
		console.error('Proxy /logout error:', e);
		return reply.code(500).send({ error: 'Proxy error during logout' });
	}
});

app.post('/set-2fa', async (req, reply) => {
	try {
		const res = await fetch(`${AUTH_URL}/set-2fa`, {
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
		const res = await fetch(`${AUTH_URL}/verify-2fa`, {
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

app.get('/users', async (req, reply) => {
	try {
		const res = await fetch(`${USER_URL}/users`, {
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
		console.error('Proxy /users error:', e);
		return reply.code(500).send({ error: 'Error fetching users' });
	}
});

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Server running at ${address}`);
});
