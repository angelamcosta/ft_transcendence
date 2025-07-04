import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import gameRoutes from './game.routes.mjs';
import { attachWebSocket } from './middleware.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const httpsOptions = {
  key: readFileSync(path.join(__dirname, process.env.GAME_KEY || 'key.pem')),
  cert: readFileSync(path.join(__dirname, process.env.GAME_CERT || 'cert.pem')),
};

const server = Fastify({
  logger: true,
  https: httpsOptions,
  ignoreTrailingSlash: true,
});

const games = new Map();

await server.register(fastifyWebsocket);

attachWebSocket(server, games);

await server.register(gameRoutes, {
  prefix: '/api/game',
  games
});

const start = async () => {
  try {
    const port = Number(process.env.GAME_PORT) || 9002;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Game service running on https://0.0.0.0:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
