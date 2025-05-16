import Fastify from 'fastify';
import matchRoutes from './match.routes.mjs';
import fastifyCookie from '@fastify/cookie';

const KEY = process.env.MATCH_KEY;
const CERT = process.env.MATCH_CERT;
const PORT = process.env.MATCH_PORT;
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

app.decorate('loadUser', loadUser(app));
app.decorate('loadMatch', loadMatch(app));
app.decorate('loadTournament', loadTournament(app));
app.decorate('authenticateRequest', authenticateRequest(app));

app.register(matchRoutes, { prefix: '/api' });

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
    err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT}`);
});
