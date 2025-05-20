import fs from 'fs';
import path from 'path';
import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import matchRoutes from './match.routes.mjs';
import fastifyCookie from '@fastify/cookie';
import { loadTournament, loadMatch, authenticateRequest } from './middleware.mjs';

const PORT = process.env.MATCH_PORT;
const KEY = process.env.MATCH_KEY;
const CERT = process.env.MATCH_CERT;
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

const shutdown = async () => {
    await app.close();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.decorate('loadMatch', loadMatch(app));
app.decorate('loadTournament', loadTournament(app));
app.decorate('authenticateRequest', authenticateRequest(app));

await app.register(sensible);

await app.register(userRoutes);

app.register(matchRoutes, { prefix: '/api' });

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
    err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT}`);
});
