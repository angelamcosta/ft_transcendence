import argon2 from 'argon2';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { randomUUID } from 'crypto';

export const db = await open({
	filename: process.env.DB_PATH,
	driver: sqlite3.Database
});

export async function hashPassword(password) {
	const hash = await argon2.hash(password);
	return { hash }
}

export async function verifyPassword(password, hash) {
	return argon2.verify(hash, password);
}

export async function inSession(id) {
	const sessionId = randomUUID();
	const row = await db.get('SELECT session_id, session_expires FROM users WHERE id = ?', id);
	const now = Math.floor(Date.now() / 1000);

	if (row.session_id && row.session_expires > now) {
		const error = new Error('This account is already logged in');
		error.statusCode = 401;
		throw error;
	}

	await db.run(`UPDATE users SET session_id = ?, session_expires = strftime('%s','now') + 3600 WHERE id = ?`, sessionId, id);
}