import fs from 'fs';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket'
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';
import { WebSocket as ws } from 'ws';
import authRoutes from './auth.routes.mjs';
import userRoutes from './user.routes.mjs';
import matchRoutes from './match.routes.mjs';
import gameRoutes from './game.routes.mjs';
import { authenticateRequest } from './chat.utils.mjs';

const __dirname = new URL('.', import.meta.url).pathname;
const KEY_PATH = process.env.SERVER_KEY || 'key.pem';
const CERT_PATH = process.env.SERVER_CERT || 'cert.pem';
const PORT = process.env.SERVER_PORT || 9000;


const db = await open({
	filename: process.env.DB_PATH,
	driver: sqlite3.Database
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

await app.register(fastifyCookie);
await app.register(websocket);

const clients = new Set();
const chatClients = new Set();

const dmRooms = new Map();
const nameBySock = new Map();
const idBySock = new Map();

app.get('/chat', { websocket: true, onRequest: authenticateRequest(app) }, async (socket, req) => {
	const userId = req.authUser.id;
	const row = await db.get('SELECT display_name FROM users WHERE id = ?', userId);


	let displayName = 'unknown';
	if (row && row.display_name)
		displayName = row.display_name;

	const current = Array.from(nameBySock.values());
	socket.send(JSON.stringify({ type: 'list', users: current }));
	socket.send(JSON.stringify({ type: 'identify', displayName }));

	const joinMsg = JSON.stringify({ type: 'join', display_name: displayName });
	for (const client of clients) {
		if (client.readyState === ws.OPEN && client !== socket)
			client.send(joinMsg);
	}

	clients.add(socket);
	chatClients.add(socket);
	idBySock.set(socket, userId);
	nameBySock.set(socket, displayName);
	socket.on('close', () => {
		for (const client of clients) {
			if (client !== socket && client.readyState === ws.OPEN) {
				client.send(JSON.stringify({ type: 'leave', display_name: displayName }));
			}
		}
		clients.delete(socket);
		idBySock.delete(socket);
		nameBySock.delete(socket);
		chatClients.delete(socket);
	});

	socket.on('message', async raw => {
		let incoming;
		try {
			incoming = JSON.parse(raw.toString());
		} catch (err) {
			return console.error('Invalid JSON from client', err);
		}
		if (incoming.type === 'identify') {
			const oldName = nameBySock.get(socket);
			const newName = incoming.display_name;
			if (oldName && newName && oldName !== newName) {
				nameBySock.set(socket, newName);
				const renameMsg = JSON.stringify({
					type: 'rename',
					old: oldName,
					_new: newName
				});
				for (let client of clients) {
					if (client.readyState === ws.OPEN)
						client.send(renameMsg);
				}
			}
			return;
		}
		if (incoming.type === 'message') {
			const broadcast = JSON.stringify({
				type: 'message',
				display_name: displayName,
				content: incoming.content,
				timestamp: Date.now()
			});
			for (const client of clients) {
				if (client.readyState === ws.OPEN && client !== socket) {
					const targetId = idBySock.get(client);
					const block = await db.get(
						`SELECT 1 FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?)
						OR (blocker_id = ? AND blocked_id = ?)`, [userId, targetId, targetId, userId]
					);
					if (block)
						continue;
					client.send(broadcast);
				}
			}
		}
	});
});

app.get('/dm', { websocket: true, onRequest: authenticateRequest(app) },
	async (socket, req) => {
		const userId = req.authUser.id;
		const meRow = await db.get('SELECT display_name FROM users WHERE id = ?', [userId]);

		let displayName = 'unknown';
		if (meRow && meRow.display_name)
			displayName = meRow.display_name;

		let roomKey;
		let clients;
		let targetId;

		socket.on('message', async raw => {
			let msg;
			try {
				msg = JSON.parse(raw.toString());
			} catch {
				return console.error('Invalid JSON from client', err);
			}

			if (msg.type === 'direct-join') {
				const row = await db.get(
					'SELECT id, display_name FROM users WHERE display_name = ?',
					[msg.targetName]
				);
				if (!row)
					return socket.close(1008, 'User not found');
				targetId = row.id;

				roomKey = [userId, targetId].sort().join(':');
				clients = dmRooms.get(roomKey);
				if (!clients) {
					clients = new Set();
					dmRooms.set(roomKey, clients);
				}

				clients.add(socket);

				socket.on('close', () => {
					clients.delete(socket);
					if (clients.size === 0)
						dmRooms.delete(roomKey);
				});

				const history = await db.all('SELECT sender_id, content, timestamp FROM dm_messages WHERE room_key = ? ORDER BY timestamp', roomKey);

				socket.send(JSON.stringify({ type: 'history', messages: history }));

				const rowMax = await db.get('SELECT MAX(timestamp) AS timestamp FROM dm_messages WHERE room_key = ?', [roomKey]);
				const newest = rowMax && rowMax.timestamp != null ? rowMax.timestamp : 0;

				await db.run('INSERT INTO dm_reads (user_id, room_key, last_read) VALUES (?, ?, ?) ON CONFLICT(user_id, room_key) DO UPDATE SET last_read = excluded.last_read', [userId, roomKey, newest]);

			} else if (msg.type === 'message') {
				if (!roomKey || !clients) return;

				const block = await db.get(
					`SELECT 1 FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?)
					OR (blocker_id = ? AND blocked_id = ?)`, [userId, targetId, targetId, userId]
				);

				if (block) {
					return socket.send(JSON.stringify({
						type: 'blocked',
						message: 'Cannot send: you are blocked or you have blocked this user'
					}));
				}

				const ts = Date.now();
				await db.run('INSERT INTO dm_messages (room_key, sender_id, content, timestamp) VALUES (?, ?, ?, ?)', [roomKey, userId, msg.content, ts]);

				const broadcast = JSON.stringify({
					type: 'message',
					display_name: displayName,
					content: msg.content,
					timestamp: ts
				});
				for (const client of clients) {
					if (client.readyState === ws.OPEN)
						client.send(broadcast);
				}

				for (const client of chatClients) {
					if (client.readyState === ws.OPEN && idBySock.get(client) === targetId && !clients.has(client)) {
						client.send(JSON.stringify({
							type: 'dm-notification',
							from: displayName
						}))
					}
				}
			}
		});
	}
);

await app.register(fastifyStatic, {
	root: path.join(__dirname, 'public'),
	prefix: '/',
});

await app.register(fastifyStatic, {
	root: path.join(__dirname, 'data', 'public', 'avatars'),
	prefix: '/avatars',
	decorateReply: false
})

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

const htmlRoutes = ['/', '/reset-password', '/login', '/register', '/settings', '/profile', '/friends', '/chat-room', '/play', '/game'];

const handler = async (req, res) => {
	try {
		const filePath = '/app/public/index.html';
		const fileContent = fs.readFileSync(filePath, 'utf-8');
		return res.type('text/html').send(fileContent);
	} catch (error) {
		console.error('Error details:', {
			error: error.message,
			path: error.path,
			stack: error.stack
		});
		return res.code(500).send('Internal Server Error - File not found');
	}
};

htmlRoutes.forEach(route => {
	app.get(route, handler);
});

await app.register(authRoutes);
await app.register(gameRoutes);
await app.register(matchRoutes);
await app.register(userRoutes);

app.setNotFoundHandler((request, reply) => {
  // Optional: log the unknown path
  request.log.warn(`404 Not Found: ${request.url}`);

  // If you want to serve your SPA's index.html for unknown routes (like React/Angular apps)
  if (request.raw.method === 'GET' && request.headers.accept && request.headers.accept.includes('text/html')) {
    const filePath = '/app/public/index.html';
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return reply.code(200).type('text/html').send(fileContent);
    } catch (err) {
      request.log.error('Error loading fallback index.html:', err);
      return reply.code(500).send('Internal Server Error');
    }
  }

  // Fallback: regular 404 response
  return reply.code(404).type('text/html').send(`
    <h1>404 - Page Not Found</h1>
    <p>The page "${request.url}" could not be found.</p>
  `);
});

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Server running at ${address}`);
});
