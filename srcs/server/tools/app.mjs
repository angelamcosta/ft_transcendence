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

app.get('/chat', { websocket: true, onRequest: authenticateRequest(app) }, async (connection, req) => {
	const socket = connection;
	const userId = req.authUser.id;
	const row = await db.get('SELECT display_name FROM users WHERE id = ?', userId);

	let displayName = 'unknown';
	if (row && row.display_name)
		displayName = row.display_name;

	const joinMsg = JSON.stringify({ type: 'join', display_name: displayName });
	for (const client of clients) {
		if (client.readyState === ws.OPEN && client !== socket)
			client.send(joinMsg);
	}
	clients.add(socket);
	socket.on('close', () => clients.delete(socket));

	socket.send(JSON.stringify({ type: 'identify', userId }));

	socket.on('message', raw => {
		let incoming;
		try {
			incoming = JSON.parse(raw.toString());
		} catch (err) {
			return console.error('Invalid JSON from client', err);
		}
		if (incoming.type === 'message') {
			const broadcast = JSON.stringify({
				type: 'message',
				display_name: displayName,
				content: incoming.content,
				timestamp: Date.now()
			});
			for (const client of clients) {
				if (client.readyState === ws.OPEN &&client !== socket)
					client.send(broadcast);
			}
		}
	});
});

await app.register(fastifyStatic, {
	root: path.join(__dirname, 'public'),
	prefix: '/',
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

app.get('/', async (req, res) => {
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
});

await app.register(authRoutes);
await app.register(gameRoutes);
await app.register(matchRoutes);
await app.register(userRoutes);

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Server running at ${address}`);
});
