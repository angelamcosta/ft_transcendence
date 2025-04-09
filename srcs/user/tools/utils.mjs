import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const db = await open({
	filename: process.env.DB_PATH,
	driver: sqlite3.Database
});