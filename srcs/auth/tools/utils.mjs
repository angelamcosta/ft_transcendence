import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createHash, randomBytes, createHmac } from 'crypto';

export const db = await open({
	filename: process.env.DB_PATH,
	driver: sqlite3.Database
});

const SECRET_KEY = process.env.JWT_SECRET
const HEADER = Buffer.from(JSON.stringify({ 
	alg: 'HS256',
	typ: 'JWT'
})).toString('base64url')

export function generateJWT(payload) {
	const now = Math.floor(Date.now() / 1000)
	const claims = {
		...payload,
		iat: now,
		exp: now + 3600
	}

	const encondedPayload = Buffer.from(JSON.stringify(claims)).toString('base64url')
	const signature = createHmac('sha256', SECRET_KEY)
		.update(`${HEADER}.${encondedPayload}`)
		.digest('base64url')
	
	return `${HEADER}.${encondedPayload}.${signature}`
}

export function verifyJWT(token) {
	const [header, payload, signature] = token.split('.')
	const expectedSig = createHmac('sha256', SECRET_KEY)
		.update(`${header}.${payload}`)
		.digest('base64url')

	if (signature !== expectedSig)
		throw new Error('Invalid signature')

	const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())

	if (decoded.exp < Date.now() / 1000)
		throw new Error('Token expired')

	return decoded
}

export function hashPassword(password, salt = randomBytes(32).toString('hex')) {
	const hash = createHash('sha256')
		.update(password + salt)
		.digest('hex')
	return { salt, hash }
}