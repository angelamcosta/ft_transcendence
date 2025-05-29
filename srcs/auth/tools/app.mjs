import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import authRoutes from './auth.routes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY = process.env.AUTH_KEY || 'key.pem';
const CERT = process.env.AUTH_CERT || 'cert.pem';
const PORT = process.env.AUTH_PORT || 9001;

const app = Fastify({
	logger: true,
	ignoreTrailingSlash: true,
	https: {
		key: fs.readFileSync(path.join(__dirname, KEY)),
		cert: fs.readFileSync(path.join(__dirname, CERT)),
	},
});

await app.register(authRoutes, { prefix: '/api' });

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Auth service running at ${address}`);
});
