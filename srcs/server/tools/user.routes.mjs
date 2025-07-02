import { fetch, Agent as UndiciAgent } from 'undici';

const USER_URL = process.env.USER_URL;
const tlsAgent = new UndiciAgent({
	connect: { rejectUnauthorized: false }
});

export default async function userRoutes(app) {
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

	app.get('/users/:id/history', async (req, reply) => {
		try{
			const userId = req.params.id;
			const res = await fetch(`${USER_URL}/api/users/${userId}/history`, {
				dispatcher: tlsAgent,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					cookie: req.headers.cookie,
				},
			}) ;
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /users/:id/history error:', e);
			return reply.code(500).send({ error: 'Error fetching match history' });
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

	app.get('/users/block/relationship/:id', async (req, reply) => {
		try {
			const userId = req.params.id;
			const res = await fetch(`${USER_URL}/api/users/block/relationship/${userId}`, {
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
			console.error('Proxy /users/block/relationship/:id error:', e);
			return reply.code(500).send({ error: 'Error fetching blocked relationship' });
		}
	})

	app.get('/users/block/status/:id', async (req, reply) => {
		try {
			const userId = req.params.id;
			const res = await fetch(`${USER_URL}/api/users/block/status/${userId}`, {
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
			console.error('Proxy /users/block/status/:id error:', e);
			return reply.code(500).send({ error: 'Error fetching blockked status' });
		}
	})

	app.post('/users/block/:id', async (req, reply) => {
		try {
			const userId = req.params.id;
			const res = await fetch(`${USER_URL}/api/users/block/${userId}`, {
				dispatcher: tlsAgent,
				method: 'POST',
				headers: {
					cookie: req.headers.cookie,
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /users/block/:id error', e);
			return reply.code(500).send({ error: 'Error blocking user' });
		}
	})

	app.delete('/users/unblock/:id', async (req, reply) => {
		try {
			const userId = req.params.id;
			const res = await fetch(`${USER_URL}/api/users/unblock/${userId}`, {
				dispatcher: tlsAgent,
				method: 'DELETE',
				headers: {
					cookie: req.headers.cookie,
				},
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

			if (!res.ok) {
				let message = 'Error fetching avatar';
				try {
					const errData = await res.json();
					message = errData?.error || message;
				} catch (_) { }

				return reply.code(res.status).send({ error: message });
			}

			const contentType = res.headers.get('Content-Type');
			const buffer = Buffer.from(await res.arrayBuffer());

			return reply
				.header('Content-Type', contentType)
				.header('Cache-Control', 'no-cache')
				.code(res.status)
				.send(buffer);

		} catch (e) {
			console.error('Proxy /users/:id/avatar error', e);
			return reply.code(500).send({ error: 'Unexpected server error while fetching avatar' });
		}
	});


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

	app.get('/users/invite/received', async (req, reply) => {
		try {
			const res = await fetch(`${USER_URL}/api/users/invite/received`, {
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
			console.error('Proxy /users/invite/received error', e);
			return reply.code(500).send({ error: 'Error fetching match invites received' });
		}
	})

	app.get('/users/invite/sent', async (req, reply) => {
		try {
			const res = await fetch(`${USER_URL}/api/users/invite/sent`, {
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
			console.error('Proxy /users/invite/sent error', e);
			return reply.code(500).send({ error: 'Error fetching match invites sent' });
		}
	})

	app.put('/users/invite/accept/:id', async (req, reply) => {
		try {
			const userId = req.params.id;
			const res = await fetch(`${USER_URL}/api/users/invite/accept/${userId}`, {
				dispatcher: tlsAgent,
				method: 'PUT',
				headers: {
					cookie: req.headers.cookie,
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /users/invite/accept/:id error:', e);
			return reply.code(500).send({ error: 'Error accepting match invite' });
		}
	})

	app.put('/users/invite/reject/:id', async (req, reply) => {
		try {
			const userId = req.params.id;
			const res = await fetch(`${USER_URL}/api/users/invite/reject/${userId}`, {
				dispatcher: tlsAgent,
				method: 'PUT',
				headers: {
					cookie: req.headers.cookie,
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /users/invite/accept/:id error:', e);
			return reply.code(500).send({ error: 'Error accepting match invite' });
		}
	})

	app.put('/users/invite/cancel/:id', async (req, reply) => {
		try {
			const userId = req.params.id;
			const res = await fetch(`${USER_URL}/api/users/invite/cancel/${userId}`, {
				dispatcher: tlsAgent,
				method: 'PUT',
				headers: {
					cookie: req.headers.cookie,
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /users/invite/cancel/:id error:', e);
			return reply.code(500).send({ error: 'Error canceling match invite' });
		}
	})

	app.post('/users/invite/:id', async (req, reply) => {
		try {
			const userId = req.params.id;
			const res = await fetch(`${USER_URL}/api/users/invite/${userId}`, {
				dispatcher: tlsAgent,
				method: 'POST',
				headers: {
					cookie: req.headers.cookie,
				},
			});
			const data = await res.json();
			return reply.code(res.status).send(data);
		} catch (e) {
			console.error('Proxy /users/invite/:id error', e);
			return reply.code(500).send({ error: 'Error sending match invite' });
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

	app.get('/users/dm/unread', async (req, reply) => {
		try {
			const res = await fetch(`${USER_URL}/api/users/dm/unread`, {
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
			console.error('Proxy /users/dm/unread', e);
			return reply.code(500).send({ error: 'Error fetching unread messages' });
		}
	})
}