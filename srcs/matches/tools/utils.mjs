import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const idRegex = /^\d+$/;

export const db = await open({
	filename: process.env.DB_PATH,
	driver: sqlite3.Database
});

export async function fetchTournamentById(id) {
	if (idRegex.test(id))
		return await db.get('SELECT * FROM tournaments WHERE id = ?', [id]);
	try {
		return await db.get('SELECT * FROM tournaments WHERE name = ?', [id]);
	} catch (err) {
		fastify.log.error(`Database error: ${err.message}`);
		throw fastify.httpErrors.internalServerError('Failed to fetch users: ' + err.message);
	}
}

export async function fetchMatchById(id) {
	try {
		if (idRegex.test(id))
			return await db.get('SELECT * FROM matches WHERE id = ?', [id]);
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

			const block = await db.get('SELECT 1 FROM BLOCKS WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)', [player1, player2, player2, player1]);

			if (block)
				continue;

			const match_id = crypto.randomUUID();

			await db.transaction(async (tx) => {
				await tx.run('INSERT INTO matches (id, player1_id, player2_id) VALUES (?, ?, ?)', [match_id, player1, player2]);
				await tx.run('DELETE FROM matchmaking_queue WHERE player_id in (?, ?)', [player1, player2]);
			});

			fastify.log.info(`Match created between ${player1} and ${player2}`);
			i++;
		}
	} catch (err) {
		fastify.log.error(`Database error: ${err.message}`);
		throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
	}
}