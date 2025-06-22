import fs from 'fs';
import path from 'path';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket'
import authRoutes from './auth.routes.mjs';
import userRoutes from './user.routes.mjs';
import matchRoutes from './match.routes.mjs';
import gameRoutes from './game.routes.mjs';

const __dirname = new URL('.', import.meta.url).pathname;
const KEY_PATH = process.env.SERVER_KEY || 'key.pem';
const CERT_PATH = process.env.SERVER_CERT || 'cert.pem';
const PORT = process.env.SERVER_PORT || 9000;

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

await app.register(websocket);

app.get('/chat', { websocket: true }, (socket, req) => {
	socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'identify', userId }));
    };
	socket.on('message', raw => {
		socket.send(raw)
	})
})

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
