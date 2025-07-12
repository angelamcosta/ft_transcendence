import { GameService } from './service.mjs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export default async function gameRoutes(fastify, opts) {
	const games = opts.games;

	const db = await open({
		filename: process.env.DB_PATH,
		driver: sqlite3.Database
	});

	fastify.post('/game/create/:id', async (req, reply) => {
		const { id } = req.params;

		const match = await db.get('SELECT * FROM matches WHERE id = ?', [id]);

		if (match && match.status === "finished")
			return reply.code(409).send({ error: 'Match is already finished' });

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

	fastify.post('/game/:id/boot', async (req, reply) => {
		const { id } = req.params;
		const row = await db.get('SELECT cli_booted FROM matches WHERE id = ?', [id]);

		if (!row)
			throw fastify.httpErrors.notFound('Match not found');

		try {
			await db.run('UPDATE matches SET cli_booted = 1 WHERE id = ?', [id]);

			return reply.code(200).send({ ok: true });
		} catch (err) {
			throw fastify.httpErrors.internalServerError('Failed to update cli_booted status: ' + err.message);
		}
	});

	fastify.get('/game/:id/boot', async (req, reply) => {
		const { id } = req.params;
		const row = await db.get('SELECT cli_booted FROM matches WHERE id = ?', [id]);

		if (!row)
			throw fastify.httpErrors.notFound('Match not found');
		const booted = row.cli_booted === 1;
		return reply.code(200).send({ booted });
	});
}
