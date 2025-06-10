import { autoPairPlayers, db } from './utils.mjs'

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
			const tournaments = await db.all('SELECT id, name, status FROM tournaments');
			return res.send(tournaments);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Failed to fetch tournaments: ' + err.message);
		}
	});

	fastify.post('/tournaments', async (req) => {
		try {
			const { name } = req.body;

			if (!name || name === undefined || typeof (name) !== 'string')
				throw fastify.httpErrors.unprocessableEntity('Request body is required');

			await db.run('INSERT INTO tournaments (name) VALUES (?)', [name]);
			return { message: 'Tournament created successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.post('/tournaments/:id/players', {
		preValidation: fastify.loadTournament,
	}, async (req) => {
		try {
			const { user_id } = req.body;

			if (!user_id || user_id === undefined)
				throw fastify.httpErrors.unprocessableEntity('Request body is required');

			if (req.tournament.status !== 'open')
				throw fastify.httpErrors.forbidden('Tournament is not accepting new players');

			const existing = await db.get('SELECT id FROM players WHERE tournament_id = ? and user_id = ?', [req.tournament.id, user_id]);

			if (existing)
				throw fastify.httpErrors.conflict('Player already registered in this tournament');

			await db.run('INSERT INTO players (tournament_id, user_id) VALUES (?, ?)', [req.tournament.id, user_id]);
			return { message: 'Player added to tournament successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.get('/tournaments/:id/matches', {
		preValidation: fastify.loadTournament,
	}, async (req) => {
		try {
			const matches = await db.all('SELECT m.id, p1.id AS player1_id, u1.display_name AS player1_name, p2.id AS player2_id, u2.display_name AS player2_name, m.status, m.score, m.created_at FROM matches m LEFT JOIN players p1 ON m.player1_id = p1.id LEFT JOIN users u1 ON p1.user_id = u1.id LEFT JOIN players p2 ON m.player2_id = p2.id LEFT JOIN users u2 ON p2.user_id = u2.id WHERE m.tournament_id = ? ORDER BY m.created_at DESC', [req.tournament.id]);
			return { matches };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.post('/matches/:id/result', {
		preValidation: fastify.loadMatch,
	}, async (req) => {
		try {
			const winnerId = Number(req.body.winner_id);
			const { score } = req.body;
			const match = req.match;

			if (![match.player1_id, match.player2_id].includes(winnerId))
				throw fastify.httpErrors.unprocessableEntity('Invalid winnerId: not a player in this match');

			if (typeof winnerId !== 'number' || typeof score !== 'string')
				throw fastify.httpErrors.unprocessableEntity('winnerId and score are required');

			if (match.status === 'finished')
				throw fastify.httpErrors.conflict('Match is already finished');

			const loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id;

			await db.run('UPDATE matches SET winner_id = ?, score = ?, status = ?, updated_at = CURRENT_TIMESTAMP  WHERE id = ?', [winnerId, score, 'finished', match.id]);

			await db.run('UPDATE players SET status = ? WHERE id = ?', ['winner', winnerId]);
			await db.run('UPDATE players SET status = ? WHERE id = ?', ['loser', loserId]);

			return { "success": true };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.get('/matches/:id', async (req) => {
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
		const { user_id } = req.body?.user_id;
		if (!user_id) throw fastify.httpErrors.un
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
