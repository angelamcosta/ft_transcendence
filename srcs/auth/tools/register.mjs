import { hashPassword } from './utils.mjs';
import { sendEmail } from './emailService.mjs'

export async function registerUser(db, {email, password}) {
	if (!email || !password) {
		const error = new Error('Missing fields')
		error.statusCode = 400
		throw error
	}

	const emailExists = await db.get('SELECT id FROM users where email = ?', [email])
	if (emailExists) {
		const error = new Error('Email already registered')
		error.statusCode = 409
		throw error
	}
	const { salt , hash } = hashPassword(password)
	const otp_code = Math.floor(100000 + Math.random() * 900000);
	const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
	try {
		await db.run('INSERT INTO users (email, passwordHash, salt, otp, expire) VALUES (?, ?, ?, ?, ?)', [email, hash, salt, otp_code, expiresAt])
		sendEmail(email, otp_code)
		return { message: 'Verification code sent'}
	} catch (dbError) {
		console.log('Database error details:', dbError)
		const error = new Error('Registration failed')
		error.statusCode = 500
		error.originalError = dbError
		throw error
	}
}