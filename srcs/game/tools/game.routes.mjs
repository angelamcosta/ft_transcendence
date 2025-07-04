import { GameService } from './service.mjs';

export default async function gameRoutes(fastify, opts) {
  const games = opts.games;

  fastify.post('/:id', async (req, reply) => {
    const { id } = req.params;
    if (!games.has(id)) {
      games.set(id, new GameService());
    }
    return { gameId: id };
  });

  fastify.post('/:id/init', async (req, reply) => {
    const game = games.get(req.params.id);
    if (!game) return reply.code(404).send({ error: 'Partida não encontrada' });
    game.reset();
    return { ok: true };
  });

  fastify.post('/:id/start', async (req, reply) => {
    const game = games.get(req.params.id);
    if (!game) return reply.code(404).send({ error: 'Partida não encontrada' });
    game.start();
    return { ok: true };
  });

  fastify.post('/:id/control/:player/:action', async (req, reply) => {
    const game = games.get(req.params.id);
    if (!game) return reply.code(404).send({ error: 'Partida não encontrada' });
    game.control(Number(req.params.player), req.params.action);
    return { ok: true };
  });
}
