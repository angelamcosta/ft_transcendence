import fs from 'fs';
import path from 'path';
import Fastify from 'fastify'
import userRoutes from './user.routes.mjs'
import { loadUser, validateUser, validateMethod } from './middleware.mjs'

const PORT = process.env.USER_PORT;
const KEY = process.env.USER_KEY;
const CERT = process.env.USER_CERT;
const __dirname = new URL('.', import.meta.url).pathname;

const app = Fastify({
	logger: true,
	https: {
		key: fs.readFileSync(path.join(__dirname, KEY)),
		cert: fs.readFileSync(path.join(__dirname, CERT)),
	},
});

const shutdown = async () => {
	await app.close();
	process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.decorate('loadUser', loadUser(app));
app.decorate('validateUser', validateUser(app));
app.decorate('validateMethod', validateMethod(app));

app.register(userRoutes, { prefix: '/api' });

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
	err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT}`);
})