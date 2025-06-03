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

app.addContentTypeParser('multipart/form-data', (request, payload, done) => {
	done(null);
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

app.get('/users', async (req, reply) => {
	try {
		const res = await fetch(`${USER_URL}/api/users`, {
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

app.get('/users/:id', async (req, reply) => {
	try {
		const userId = req.params.id;
		const res = await fetch(`${USER_URL}/api/users/${userId}`, {
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
		console.error('Proxy /users/:id error:', e);
		return reply.code(500).send({ error: 'Error fetching users' });
	}
})

app.put('/users/:id', async (req, reply) => {
	try {
		const userId = req.params.id;
		const res = await fetch(`${USER_URL}/api/users/${userId}`, {
			dispatcher: tlsAgent,
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				cookie: req.headers.cookie,
			},
			body: JSON.stringify(req.body),
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	} catch (e) {
		console.error('Proxy /users/:id error:', e);
		return reply.code(500).send({ error: 'Error updating user' });
	}
})

app.delete('/users/:id', async (req, reply) => {
	try {
		const userId = req.params.id;
		const res = await fetch(`${USER_URL}/api/users/${userId}`, {
			dispatcher: tlsAgent,
			method: 'DELETE',
			headers: {
				cookie: req.headers.cookie,
			},
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	} catch (e) {
		console.error('Proxy /users/:id error:', e);
		return reply.code(500).send({ error: 'Error deleting user' });
	}
})

app.post('/users/block/:id', async (req, reply) => {
	try {
		const userId = req.params.id;
		const res = await fetch(`${USER_URL}/api/users/block/${userId}`, {
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
		console.error('Proxy /users/block/:id error', e);
		return reply.code(500).send({ error: 'Error blocking user' });
	}
})

app.post('/users/unblock/:id', async (req, reply) => {
	try {
		const userId = req.params.id;
		const res = await fetch(`${USER_URL}/api/users/unblock/${userId}`, {
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
		console.error('Proxy /users/unblock/:id error', e);
		return reply.code(500).send({ error: 'Error unblocking user' });
	}
})

app.get('/users/:id/avatar', async (req, reply) => {
	try {
		const userId = req.params.id;
		const res = await fetch(`${USER_URL}/api/users/${userId}/avatar`, {
			dispatcher: tlsAgent,
			method: 'GET',
			headers: {
				cookie: req.headers.cookie,
			},
		});
		const contentType = res.headers.get('Content-Type');
		const buffer = Buffer.from(await res.arrayBuffer());

		return reply.header('Content-Type', contentType).code(res.status).send(buffer);
	} catch (e) {
		console.error('Proxy /users/:id/avatar error', e);
		return reply.code(500).send({ error: 'Error fetching avatar' });
	}
})

app.put('/users/:id/avatar', { body: false }, async (req, reply) => {
	try {
		const userId = req.params.id;
		const res = await fetch(`${USER_URL}/api/users/${userId}/avatar`, {
			dispatcher: tlsAgent,
			method: 'PUT',
			headers: {
				'Content-Type': req.headers['content-type'],
				cookie: req.headers.cookie,
			},
			body: req.raw,
			duplex: 'half',
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	} catch (e) {
		console.error('Proxy /users/:id/avatar error', e);
		return reply.code(500).send({ error: 'Error uploading avatar' });
	}
})

app.delete('/users/:id/avatar', async (req, reply) => {
	try {
		const userId = req.params.id;
		const res = await fetch(`${USER_URL}/api/users/${userId}/avatar`, {
			dispatcher: tlsAgent,
			method: 'DELETE',
			headers: {
				cookie: req.headers.cookie,
			},
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	} catch (e) {
		console.error('Proxy /users/:id/avatar error', e);
		return reply.code(500).send({ error: 'Error deleting avatar' });
	}
})

app.get('/users/friends', async (req, reply) => {
	try {
		const res = await fetch(`${USER_URL}/api/users/friends`, {
			dispatcher: tlsAgent,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				cookie: req.headers.cookie,
			}
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	} catch (e) {
		console.error('Proxy /users/friends error', e);
		return reply.code(500).send({ error: 'Error fetching friends' });
	}
})

app.get('/users/friends/:id', async (req, reply) => {
	try {
		const userId = req.params.id;
		const res = await fetch(`${USER_URL}/api/users/friends/${userId}`, {
			dispatcher: tlsAgent,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				cookie: req.headers.cookie,
			}
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	} catch (e) {
		console.error('Proxy /users/friends/:id error', e);
		return reply.code(500).send({ error: 'Error fetching friend individually' });
	}
})

app.post('/users/friends/add/:id', async (req, reply) => {
	try {
		const userId = req.params.id;
		const res = await fetch(`${USER_URL}/api/users/friends/add/${userId}`, {
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
		console.error('Proxy /users/friends/add/:id error', e);
		return reply.code(500).send({ error: 'Error adding friend' });
	}
})

app.put('/users/friends/accept/:id', async (req, reply) => {
	try {
		const userId = req.params.id;
		const res = await fetch(`${USER_URL}/api/users/friends/accept/${userId}`, {
			dispatcher: tlsAgent,
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				cookie: req.headers.cookie,
			},
			body: JSON.stringify(req.body),
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	} catch (e) {
		console.error('Proxy /users/friends/accept/:id:', e);
		return reply.code(500).send({ error: 'Error accepting friendship' });
	}
})

app.put('/users/friends/reject/:id', async (req, reply) => {
	try {
		const userId = req.params.id;
		const res = await fetch(`${USER_URL}/api/users/friends/reject/${userId}`, {
			dispatcher: tlsAgent,
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				cookie: req.headers.cookie,
			},
			body: JSON.stringify(req.body),
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	} catch (e) {
		console.error('Proxy /users/friends/reject/:id:', e);
		return reply.code(500).send({ error: 'Error rejecting friendship' });
	}
})

app.delete('/users/friends/:id', async (req, reply) => {
	try {
		const userId = req.params.id;
		const res = await fetch(`${USER_URL}/api/users/friends/${userId}`, {
			dispatcher: tlsAgent,
			method: 'DELETE',
			headers: {
				cookie: req.headers.cookie,
			},
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	} catch (e) {
		console.error('Proxy /users/friends/:id error', e);
		return reply.code(500).send({ error: 'Error deleting friend' });
	}
})

app.get('/users/friends/requests', async (req, reply) => {
	try {
		const res = await fetch(`${USER_URL}/api/users/friends/requests`, {
			dispatcher: tlsAgent,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				cookie: req.headers.cookie,
			}
		});
		const data = await res.json();
		return reply.code(res.status).send(data);
	} catch (e) {
		console.error('Proxy /users/friends/requests', e);
		return reply.code(500).send({ error: 'Error fetching friend requests' });
	}
})

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Server running at ${address}`);
});

// Stuff to fix:
//
// Even when user 3 is blocked, i can still send a friend request, and user 3 can see the request and accept it
// When friend request is rejected, resending the friend request causes database error