import fs from 'fs';
import path from 'path';
import Fastify from 'fastify';
import gameRoutes from './game.routes.mjs';
import { attachWebSocket } from './middleware.mjs';

const __dirname = new URL('.', import.meta.url).pathname;
const PORT = process.env.GAME_PORT || 9002;

const app = Fastify({
  logger: true,
  ignoreTrailingSlash: true,
  https: {
    key: fs.readFileSync(path.join(__dirname, process.env.GAME_KEY || 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, process.env.GAME_CERT || 'cert.pem'))
  }
});

const shutdown = async () => {
	await app.close();
	process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.register(gameRoutes, { prefix: '/api' });

const server = app.server;
attachWebSocket(server);

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server running at ${address}`);
});