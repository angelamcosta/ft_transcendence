import fs from 'fs';
import path from 'path';
import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import userRoutes from './user.routes.mjs';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import { isUser, isAdmin, loadUser, isBlocked, loadAvatar, notBlocked, validateData, validateUsers, loadFriendship, authenticateRequest } from './middleware.mjs';

const PORT = process.env.USER_PORT;
const KEY = process.env.USER_KEY;
const CERT = process.env.USER_CERT;
const __dirname = new URL('.', import.meta.url).pathname;

const app = Fastify({
	logger: true,
	ignoreTrailingSlash: true,
	https: {
		key: fs.readFileSync(path.join(__dirname, KEY)),
		cert: fs.readFileSync(path.join(__dirname, CERT)),
	},
});

app.register(fastifyCookie);

app.register(fastifyMultipart, {
	limits: {
		fileSize: 2 * 1024 * 1024
	}
});

const shutdown = async () => {
	await app.close();
	process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.decorate('isUser', isUser(app));
app.decorate('isAdmin', isAdmin(app));
app.decorate('loadUser', loadUser(app));
app.decorate('isBlocked', isBlocked(app));
app.decorate('loadAvatar', loadAvatar(app));
app.decorate('notBlocked', notBlocked(app));
app.decorate('validateData', validateData(app));
app.decorate('validateUsers', validateUsers(app));
app.decorate('loadFriendship', loadFriendship(app));
app.decorate('authenticateRequest', authenticateRequest(app));

await app.register(sensible);

app.register(userRoutes, { prefix: '/api' });

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
	err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT}`);
});
