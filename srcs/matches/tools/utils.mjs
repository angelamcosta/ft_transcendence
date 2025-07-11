import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fetch, Agent as UndiciAgent } from 'undici';

export const idRegex = /^\d+$/;

export const db = await open({
	filename: process.env.DB_PATH,
	driver: sqlite3.Database
});

const SERVER_URL = process.env.SERVER_URL;

const tlsAgent = new UndiciAgent({
	connect: { rejectUnauthorized: false }
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
	if (!id) throw new Error('fetchMatchById: missing id');
	try {
		const sql = idRegex.test(id) ? 'SELECT * FROM matches WHERE id = ?' : (() => { throw new Error('fetchMatchById: id must be numeric') });
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

export async function generatePlayerBracket(tournamentId, fastify) {
	try {
		// Buscar exatamente 4 jogadores com status “accepted”
		const players = await db.all(`
      SELECT
        p.user_id    AS player_id,
        u.display_name
      FROM players p
      JOIN users   u ON p.user_id = u.id
      WHERE p.tournament_id = ?
        AND p.status        = 'accepted'
      ORDER BY p.id
      LIMIT 4
    `, [tournamentId]);


		if (players.length !== 4) {
			throw new Error(
				`Bracket expects exactly 4 accepted players, found ${checkPlayers.length}`
			);
		}

		const seeds = players
			.map(p => ({ id: p.player_id, name: p.display_name }))
			.sort(() => Math.random() - 0.5);

		const [seed1, seed2, seed3, seed4] = seeds;

		const stmt = await db.prepare(`
      INSERT INTO matches
        (tournament_id, player1_id, player2_id, round)
      VALUES (?, ?, ?, 1)
    `);
		await stmt.run(tournamentId, seed1.id, seed4.id);
		await stmt.run(tournamentId, seed2.id, seed3.id);
		await stmt.finalize();
		console.log("4-player bracket generated and stored!");

		const tourRow = await db.get('SELECT name FROM tournaments WHERE id = ?', tournamentId);
		const tourName = tourRow.name;
		const semi1 = { p1: seed1.name, p2: seed4.name };
    	const semi2 = { p1: seed2.name, p2: seed3.name };

		sendSemisNoti(semi1, semi2, tourName, fastify);
	} catch (err) {
		fastify.log.error(`Database error: ${err.message}`);
		throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
	}
}


async function sendSemisNoti(semi1, semi2, tourName, fastify) {
	const res = await fetch(`${SERVER_URL}/notify/semis`, {
		dispatcher: tlsAgent,
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			semi1,
			semi2,
			tourName
		})
	});
	const data = await res.json();
	if (!res.ok)
		throw fastify.httpErrors.internalServerError('Failed sending notification: ' + data.message);
}

export async function sendFinalsNoti(w1, w2, tourName, fastify) {
	const { player1, player2 } = await db.get(`SELECT u1.display_name AS player1, u2.display_name AS player2
		FROM players p1 JOIN users u1 ON p1.user_id = u1.id JOIN players p2 
		JOIN users u2 ON p2.user_id = u2.id WHERE p1.id = ? AND p2.id = ?`, [w1, w2]);

	const payload = { player1, player2, tourName };

	const res = await fetch(`${SERVER_URL}/notify/finals`, {
		dispatcher: tlsAgent,
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	const data = await res.json();
	if (!res.ok)
		throw fastify.httpErrors.internalServerError('Failed sending notification: ' + data.message);
}