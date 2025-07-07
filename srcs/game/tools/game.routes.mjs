import { GameService } from './service.mjs';
import { validateEmptyBody } from './middleware.mjs'

export default async function gameRoutes(fastify, opts) {
  const games = opts.games;

  fastify.addHook('preHandler', validateEmptyBody);

  fastify.post('/:id', async (req, res) => {
    const { id } = req.params;
    if (!games.has(id))
      games.set(id, new GameService());

    return res(201).send({ gameId: id });
  });

  fastify.post('/:id/init', async (req, res) => {
    const game = games.get(req.params.id);

    if (!game) return reply.code(404).send({ error: 'Match not found' });

    game.reset();
    return res(201).send({ ok: true });
  });

  fastify.post('/:id/start', async (req, res) => {
    const game = games.get(req.params.id);

    if (!game) return reply.code(404).send({ error: 'Match not found' });
    
    game.start();
    return res(201).send({ ok: true });
  });

  fastify.post('/:id/control/:player/:action', async (req, res) => {
    if (err.code === 'FST_ERR_CTP_EMPTY_JSON_BODY')
      return reply.code(400).send({ error: 'JSON body is empty' });

    reply.send(err);

    const game = games.get(req.params.id);
    if (!game) return reply.code(404).send({ error: 'Match not found' });
    game.control(Number(req.params.player), req.params.action);
    return res(201).send({ ok: true });
  });
}