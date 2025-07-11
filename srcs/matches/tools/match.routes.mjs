import { db, generatePlayerBracket } from './utils.mjs'
import { validateEmptyBody } from './middleware.mjs'

const GAME_URL = process.env.GAME_URL;
if (!GAME_URL) throw new Error('⛔️ Missing env GAME_URL');

export default async function matchRoutes(fastify) {
	//fastify.addHook('preHandler', validateEmptyBody);

	fastify.get('/matches', async (req, res) => {
		try {
			const matches = await db.all('SELECT player1_id, player2_id, status FROM matches');

			return res.code(200).send(matches);
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Failed to fetch matches: ', err.message);
		}
	});

	fastify.get('/tournaments', async (req, res) => {
		try {
			const tournaments = await db.all(`SELECT id, name, status, capacity, current_capacity, created_by 
				FROM tournaments ORDER BY id DESC`);

			return res.code(200).send(tournaments);
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Failed to fetch tournaments: ', err.message);
		}
	});

	fastify.post('/tournaments', {
		preValidation: fastify.authenticateRequest
	}, async (req, res) => {
		try {
			const user_id = req.authUser.id;
			const { name } = req.body;

			if (typeof name !== 'string' || !name.trim())
				throw fastify.httpErrors.unprocessableEntity('Request body is required');

			if (name.length > 12)
				throw fastify.httpErrors.forbidden('Tournament name cannot be longer than 12 characters');

			const row = await db.get(`SELECT display_name FROM users WHERE id = ?`, user_id);

			const result = await db.run('INSERT INTO tournaments (created_by, name) VALUES (?, ?)', [row.display_name, name.trim()]);
			return res.code(201).send({ message: 'Tournament created successfully', id: result.lastID });
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.delete('/tournaments/:id', {
		preValidation: [fastify.loadTournament, fastify.authenticateRequest]
	}, async (req, res) => {
		try {
			const user_id = req.authUser.id;
			const tour = req.tournament;

			if (tour.status !== 'open')
				throw fastify.httpErrors.forbidden('Cannot delete tournament after it already started');

			const user = await db.get(`SELECT display_name FROM users WHERE id = ?`, user_id);
			const tournament = await db.get(`SELECT created_by FROM tournaments WHERE id = ?`, tour.id);

			if (user.display_name !== tournament.created_by)
				throw fastify.httpErrors.forbidden(`Cannot delete someone else's tournament`);

			await db.run(`DELETE FROM tournaments WHERE id = ?`, tour.id);
			return res.code(200).send({ message: 'Tournament deleted successfully' });
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	})

	fastify.post('/tournaments/:id/players', {
		preValidation: [fastify.loadTournament, fastify.authenticateRequest]
	}, async (req, res) => {
		try {
			const user_id = req.authUser.id;
			const tour = req.tournament;

			if (tour.status !== 'open')
				throw fastify.httpErrors.forbidden('Tournament not open for registration');

			const exists = await db.get('SELECT 1 FROM players WHERE tournament_id = ? AND user_id = ?', [tour.id, user_id]);

			if (exists)
				throw fastify.httpErrors.conflict('You are already participating in this tournament');

			await db.run('INSERT INTO players (tournament_id, user_id) VALUES (?, ?)', [tour.id, user_id]);
			await db.run('UPDATE tournaments SET current_capacity = current_capacity + 1 WHERE id = ?', tour.id);
			const { count } = await db.get('SELECT COUNT(*) AS count FROM players WHERE tournament_id = ?', [tour.id]);

			if (count === tour.capacity) {
				await db.run(
					'UPDATE tournaments SET status = ? WHERE id = ?',
					['in_progress', tour.id]
				)
				const players = await db.all(`SELECT id FROM players WHERE tournament_id = ?`, tour.id);
				for (const p of players)
					await db.run(`UPDATE players SET status = 'accepted' WHERE id = ?`, p.id);
				await generatePlayerBracket(tour.id);
			}
			return res.code(201).send({ message: 'Joined tournament', players: count });
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.get('/tournaments/:id/matches', {
		preValidation: fastify.loadTournament
	}, async (req, res) => {
		const matches = await db.all(` SELECT m.id, m.player1_id, u1.display_name AS player1, m.player2_id, u2.display_name 
		AS player2, m.status, m.score, m.round FROM matches m LEFT JOIN users u1 ON m.player1_id = u1.id
    	LEFT JOIN users u2 ON m.player2_id = u2.id WHERE m.tournament_id = ? ORDER BY m.round, m.created_at`
			, [req.tournament.id]);

		return res.code(200).send({ matches });
	});

	fastify.post('/matches/:id/result', {
		preValidation: fastify.loadMatch
	}, async (req, res) => {
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

		fastify.log.info(`Match ${match.id} finished, winner ${winnerId}`)

		if (match.tournament_id) {
			if (match.round === 1) {
				const { count } = await db.get(`SELECT COUNT(*) AS count FROM matches
            		WHERE tournament_id = ? AND round = 1 AND status = 'finished'`, [match.tournament_id]);
				
				if (count === 2) {
					const winners = await db.all(`SELECT winner_id FROM matches
            			WHERE tournament_id = ? AND round = 1 AND status = 'finished'`,
						[match.tournament_id]);
					const [w1, w2] = winners.map(r => r.winner_id);
					await db.run(`INSERT INTO matches (tournament_id, player1_id, player2_id, round) 
						VALUES (?, ?, ?, 2)`, [match.tournament_id, w1, w2]);
				}
			}

			if (match.round === 2)
				await db.run(`UPDATE tournaments SET status = 'finished' WHERE id = ?`, match.tournament_id);
		}
		return res.code(201).send({ success: true });
	});

	fastify.get('/matches/:id',
		{ preValidation: fastify.loadMatch },
		async (req, res) => {
			try {
				const match = await db.get(`SELECT m.id, m.tournament_id, m.player1_id, m.player2_id, m.winner_id, 
					m.status, m.score, m.created_at, m.updated_at, m.round, 
					u1.display_name AS player1_name, u2.display_name AS player2_name,
					uw.display_name AS winner_name FROM matches m
					LEFT JOIN users u1 ON m.player1_id = u1.id
					LEFT JOIN users u2 ON m.player2_id = u2.id
					LEFT JOIN users uw ON m.winner_id    = uw.id
					WHERE m.id = ?`, [req.params.id]);
				return res.code(200).send({ match });
			} catch (err) {
				if (err.statusCode && err.statusCode !== 500)
					throw err;
				fastify.log.error(`Database error: ${err.message}`);
				throw fastify.httpErrors.internalServerError('Database update failed: ', err.message);
			}
		});

	// ! matchmaking
	fastify.delete('/matchmaking/leave', async (req, reply) => {
		try {
			const { user_id } = req.body;

			if (!user_id) throw fastify.httpErrors.unprocessableEntity('`user_id` is required');

			const result = await db.run(`DELETE FROM matchmaking_queue WHERE player_id = ?`, [user_id]);
			return res.code(200).send({ "left": result.changes > 0 });
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ', err.message);
		}
	});

	fastify.post('/matchmaking/join', async (req, reply) => {
		const user_id = req.body?.user_id;
		try {
			const exists = await db.get('SELECT 1 FROM matchmaking_queue WHERE player_id = ?', [user_id]);

			if (exists)
				throw fastify.httpErrors.conflict('Player already in queue');

			await db.run('INSERT INTO matchmaking_queue (player_id) VALUES (?)', [user_id]);
			return res.code(201).send({ "queued": true });
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ', err.message);
		}
	});
}