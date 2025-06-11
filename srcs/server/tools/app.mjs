import fs from 'fs';
import path from 'path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import authRoutes from './auth.routes.mjs';
import userRoutes from './user.routes.mjs';
import matchRoutes from './match.routes.mjs';

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

app.get('/', async function handler(request, reply) {
	return reply.sendFile('index.html');
});

await app.register(authRoutes);
await app.register(userRoutes);
await app.register(matchRoutes);

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log(`Server running at ${address}`);
});
