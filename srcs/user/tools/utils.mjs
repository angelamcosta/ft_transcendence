import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const idRegex = /^\d+$/;
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const db = await open({
	filename: process.env.DB_PATH,
	driver: sqlite3.Database
});

export async function fetchUserById(id, fastify) {
	if (!Number.isInteger(id) || id < 1)
			throw fastify.httpErrors.badRequest('Invalid ID')
	const sql = idRegex.test(id) ? 'SELECT * FROM users WHERE id = ?' : 'SELECT * FROM users WHERE display_name = ?';
	try {
		return await db.get(sql, [id]);
	} catch (err) {
		fastify.log.error(`Database error: ${err.message}`);
		throw fastify.httpErrors.internalServerError('Failed to fetch users: ' + err.message);
	}
}

export async function fetchInviteById(id, fastify) {
	try {
		const invite = await db.get('SELECT * FROM match_invites WHERE id = ?', id);

		if (!invite)
			throw fastify.httpErrors.badRequest('Failed to fetch invites');
		return invite;
	} catch (err) {
		fastify.log.error(`Database error: ${err.message}`);
		throw fastify.httpErrors.internalServerError('Failed to fetch users: ' + err.message);
	}
}
