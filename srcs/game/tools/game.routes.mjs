import { GameService } from './service.mjs';
import { validateEmptyBody } from './middleware.mjs'

export default async function gameRoutes(fastify, opts) {
	const games = opts.games;

	//fastify.addHook('preHandler', validateEmptyBody);

	fastify.post('/game/create/:id', async (req, reply) => {
		const { id } = req.params;
		if (!games.has(id))
			games.set(id, new GameService());

		return reply.code(201).send({ gameId: id });
	});

	fastify.post('/game/:id/init', async (req, reply) => {
		const game = games.get(req.params.id);

		if (!game) return reply.code(404).send({ error: 'Match not found' });

		game.reset();
		return reply.code(201).send({ ok: true });
	});

	fastify.post('/game/:id/start', async (req, reply) => {
		const game = games.get(req.params.id);

		if (!game) return reply.code(404).send({ error: 'Match not found' });

		game.start();
		return reply.code(201).send({ ok: true });
	});

	fastify.post('/game/:id/control/:player/:action', async (req, reply) => {
		const { id, player, action } = req.params;

		const game = games.get(id);
		const act = (action === 'up' || action === 'down') ? action : '';
		if (!game) return reply.code(404).send({ error: 'Match not found' });
		game.control(Number(player), act);
		return reply.code(200).send({ ok: true });
	});
}
