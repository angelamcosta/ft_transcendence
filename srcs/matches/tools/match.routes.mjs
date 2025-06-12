import { db, autoPairPlayers } from './utils.mjs'

export default async function matchRoutes(fastify) {
	const interval = setInterval(() => { autoPairPlayers(fastify); }, 15000);

	fastify.addHook('onClose', async (_instance, done) => {
		clearInterval(interval);
		done();
	});

	fastify.get('/matches', async (req, res) => {
		try {
			const matches = await db.all('SELECT player1_id, player2_id, status FROM matches');
			return res.send(matches);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Failed to fetch matches: ' + err.message);
		}
	});

	fastify.get('/tournaments', async (req, res) => {
		try {
			const tournaments = await db.all('SELECT id, name, status, capacity FROM tournaments');
			return res.send(tournaments);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Failed to fetch tournaments: ' + err.message);
		}
	});

	fastify.post('/tournaments', async (req) => {
		try {
			const { name, capacity } = req.body;

			if (!name || name === undefined || typeof (name) !== 'string')
				throw fastify.httpErrors.unprocessableEntity('Request body is required');

			if (typeof capacity !== 'number' || capacity <= 0 || (capacity & (capacity - 1)) !== 0 || 6 >= capacity)
				throw fastify.httpErrors.unprocessableEntity('`capacity` must be a power of two and has a max of 6 players');

			await db.run('INSERT INTO tournaments (name, capacity) VALUES (?, ?)', [name, capacity]);
			return { message: 'Tournament created successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.post('/tournaments/:id/players', {
		preValidation: fastify.loadTournament
	}, async (req) => {
		const { user_id } = req.body;
		const tour = req.tournament;

		if (!user_id)
			throw fastify.httpErrors.unprocessableEntity('`user_id` is required');

		if (tour.status !== 'open')
			throw fastify.httpErrors.forbidden('Tournament not open for registration');

		const exists = await db.get('SELECT 1 FROM players WHERE tournament_id = ? AND user_id = ?', [tour.id, user_id]);

		if (exists)
			throw fastify.httpErrors.conflict('Already joined');

		await db.run('INSERT INTO players (tournament_id, user_id) VALUES (?, ?)', [tour.id, user_id]);
		const { count } = await db.get('SELECT COUNT(*) AS count FROM players WHERE tournament_id = ?', [tour.id]);

		if (count === tour.capacity)
			// TODO : - start tounament
		return { message: 'Joined tournament', players: count };
	});

	fastify.get('/tournaments/:id/matches', {
		preValidation: fastify.loadTournament
	}, async (req) => {
		const matches = await db.all(`SELECT m.id, p1.id AS player1_id, u1.display_name AS player1, p2.id AS player2_id, u2.display_name AS player2, m.status, m.score, m.round FROM matches m JOIN players p1 ON m.player1_id = p1.id JOIN users u1 ON p1.user_id = u1.id JOIN players p2 ON m.player2_id = p2.id JOIN users u2 ON p2.user_id = u2.id WHERE m.tournament_id = ? ORDER BY m.round, m.created_at`, [req.tournament.id]);

		return { matches };
	});

	fastify.post('/matches/:id/result', {
		preValidation: fastify.loadMatch
	}, async (req) => {
		const winnerId = Number(req.body.winner_id);
		const score = req.body.score;
		const match = req.match;

		if (![match.player1_id, match.player2_id].includes(winnerId))
			throw fastify.httpErrors.unprocessableEntity('Invalid winner');
		if (match.status === 'finished')
			throw fastify.httpErrors.conflict('Match already finished');

		await db.run('UPDATE matches SET winner_id=?, score=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [winnerId, score, 'finished', match.id]);

		const loser = winnerId === match.player1_id ? match.player2_id : match.player1_id;

		await db.run('UPDATE players SET status=? WHERE id IN (?, ?)', ['winner', winnerId, loser]);
		await db.run('UPDATE players SET status=? WHERE id=?', ['loser', loser]);

		// TODO : - advance round if in tournament

		return { success: true };
	});

	fastify.get('/matches/:id',
		{ preValidation: fastify.loadMatch },
		async (req) => {
			try {
				const match = await db.get('SELECT m.*, p1.id AS player1_id, u1.display_name AS player1_name, p2.id AS player2_id, u2.display_name AS player2_name, w.id AS winner_id, uw.display_name AS winner_name FROM matches m LEFT JOIN players p1 ON m.player1_id = p1.id LEFT JOIN users u1 ON p1.user_id = u1.id LEFT JOIN players p2 ON m.player2_id = p2.id LEFT JOIN users u2 ON p2.user_id = u2.id LEFT JOIN players w ON m.winner_id = w.id LEFT JOIN users uw ON w.user_id = uw.id WHERE m.id = ?', [req.params.id]);
				return { match };
			} catch (err) {
				fastify.log.error(`Database error: ${err.message}`);
				throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
			}
		});

	// ! matchmaking
	fastify.delete('/matchmaking/leave', async (req, reply) => {
		const { user_id } = req.body;

		if (!user_id) throw fastify.httpErrors.unprocessableEntity('`user_id` is required');

		try {
			const result = await db.run(`DELETE FROM matchmaking_queue WHERE player_id = ?`, [user_id]);
			return { "left": result.changes > 0 };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.post('/matchmaking/join', async (req, reply) => {
		const user_id = req.body?.user_id;
		try {
			const exists = await db.get('SELECT 1 FROM matchmaking_queue WHERE player_id = ?', [user_id])
			if (exists)
				throw fastify.httpErrors.conflict('Player already in queue');
			await db.run('INSERT INTO matchmaking_queue (player_id) VALUES (?)', [user_id]);
			return { "queued": true };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});
}
