import argon2 from 'argon2';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

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