import fs from 'fs';
import path from 'path';
import Fastify from 'fastify';
import { fileURLToPath } from 'url';
import chatRoutes from './chat.routes.mjs'
import sensible from '@fastify/sensible'
import websocket from '@fastify/websocket'
import fastifyCookie from '@fastify/cookie';
import { authenticateRequest } from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.CHAT_PORT || 8002;
const KEY = process.env.CHAT_KEY;
const CERT = process.env.CHAT_CERT;

const app = Fastify({
	logger: true,
	ignoreTrailingSlash: true,
	https: {
		key: fs.readFileSync(path.join(__dirname, KEY)),
		cert: fs.readFileSync(path.join(__dirname, CERT)),
	},
});

app.decorate('authenticateRequest', authenticateRequest(app));

await app.register(sensible);
await app.register(fastifyCookie);
await app.register(websocket);
await app.register(chatRoutes);

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log(`Server running at ${address}`);
});
