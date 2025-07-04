import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const idRegex = /^\d+$/;

export const db = await open({
	filename: process.env.DB_PATH,
	driver: sqlite3.Database
});

export async function fetchTournamentById(id) {
	if (!id) throw new Error('fetchTournamentById: missing id');

	const sql = idRegex.test(id) ? 'SELECT * FROM tournaments WHERE id = ?' : 'SELECT * FROM tournaments WHERE name = ?';
	try {
		const row = await db.get(sql, [id]);
		return row || null;
	} catch (err) {
		fastify.log.error(`Database error: ${err.message}`);
		throw fastify.httpErrors.internalServerError('Failed to fetch users: ' + err.message);
	}
}

export async function fetchMatchById(id) {
	if (!id) throw new Error('fetchTournamentById: missing id');
	try {
		const sql = idRegex.test(id) ? 'SELECT * FROM matches WHERE id = ?' : (() => {throw new Error('fetchMatchById: id must be numeric')});
		const row = await db.get(sql, [id]);
		return row || null;
	} catch (err) {
		fastify.log.error(`Database error: ${err.message}`);
		throw fastify.httpErrors.internalServerError('Failed to fetch users: ' + err.message);
	}
}

export async function autoPairPlayers(fastify) {
	try {
		const queue = await db.all('SELECT player_id FROM matchmaking_queue ORDER BY joined_at ASC');

		for (let i = 0; i + 1 < queue.length; i++) {
			const player1 = queue[i].player_id;
			const player2 = queue[i + 1].player_id;

			if (!player2)
				break;

			const block = await db.get('SELECT 1 FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)', [player1, player2, player2, player1]);

			if (block)
				continue;

			await db.run('INSERT INTO matches (player1_id, player2_id) VALUES (?, ?)', [player1, player2]);
			await db.run('DELETE FROM matchmaking_queue WHERE player_id in (?, ?)', [player1, player2]);

			fastify.log.info(`Match created between ${player1} and ${player2}`);
			i++;
		}
	} catch (err) {
		fastify.log.error(`Database error: ${err.message}`);
		throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
	}
}

export async function generateSixPlayerBracket(tournamentId) {
  try {
    // Buscar exatamente 4 jogadores com status “accepted”
    const players = await db.all(
      `SELECT p.id AS player_id
         FROM players p
        WHERE (p.tournament_id = ?)
          AND (p.status = 'accepted')
        ORDER BY p.id
        LIMIT 4;`,
      tournamentId
    );

    if (players.length !== 4) {
      throw new Error(
        `Bracket expects exactly 4 accepted players, found ${players.length}`
      );
    }

    // Seed dos 4 jogadores
    const [seed1, seed2, seed3, seed4] = players.map(p => p.player_id);

    const now = Date.now();
    const matches = [
      // Semifinais (round 1)
      { round: 1, player1_id: seed1, player2_id: seed4 },
      { round: 1, player1_id: seed2, player2_id: seed3 },
      // Final (round 2), aguardando vencedores
      { round: 2, player1_id: null, player2_id: null }
    ];

    const stmt = await db.prepare(`
      INSERT INTO matches
        (tournament_id,
         player1_id,
         player2_id,
         winner_id,
         status,
         score,
         round,
         created_at,
         updated_at)
      VALUES
        (?, ?, ?, NULL, 'pending', NULL, ?, ?, ?);
    `);

    for (const m of matches) {
      await stmt.run(
        tournamentId,
        m.player1_id,
        m.player2_id,
        m.round,
        now,
        now
      );
    }

    await stmt.finalize();
    console.log("4-player bracket generated and stored!");
  } finally {
    await db.close();
  }
}