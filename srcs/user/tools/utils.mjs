import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const idRegex = /^\d+$/;
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const db = await open({
	filename: process.env.DB_PATH,
	driver: sqlite3.Database
});

export async function fetchUserById(id) {
	if (idRegex.test(id))
		return await db.get('SELECT * FROM users WHERE id = ?', [id]);
	try {
		return await db.get('SELECT * FROM users WHERE display_name = ?', [id]);
	} catch (err) {
		fastify.log.error(`Database error: ${err.message}`);
		throw fastify.httpErrors.internalServerError('Failed to fetch users: ' + err.message);
	}
}
