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
		throw httpErrors.internalServerError('Failed to fetch users: ' + err.message);
	}
}

export async function fetchMatchById(id) {
	try {
		if (idRegex.test(id))
			return await db.get('SELECT * FROM matches WHERE id = ?', [id]);
	} catch (err) {
		fastify.log.error(`Database error: ${err.message}`);
		throw httpErrors.internalServerError('Failed to fetch users: ' + err.message);
	}
}
