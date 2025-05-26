import { hashPassword } from './utils.mjs';

export async function registerUser(db, {email, password}) {
	if (!email || !password) {
		const error = new Error('Missing fields')
		error.statusCode = 400
		throw error
	}

	if (/\s/.test(email) || /\s/.test(password)) {
		const error = new Error('Email and password must not contain whitespace')
		error.statusCode = 400
		throw error
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	if (!emailRegex.test(email)) {
		const error = new Error('Invalid email format')
		error.statusCode = 400
		throw error
	}

	if (password.length < 6) {
		const error = new Error('Password must be at least 6 characters')
		error.statusCode = 400
		throw error
	}

	email = email.toLowerCase()
	const emailExists = await db.get('SELECT id FROM users where email = ?', [email])
	if (emailExists) {
		const error = new Error('Email already registered')
		error.statusCode = 409
		throw error
	}

	const { salt , hash } = hashPassword(password)
	try {
		await db.run(`INSERT INTO users (email, passwordHash, salt, twofa_status) VALUES (?, ?, ?, 'disabled')`, [email, hash, salt])
		return { message: 'Registration successful' }
	} catch (dbError) {
		console.log('Database error details:', dbError)
		const error = new Error('Registration failed')
		error.statusCode = 500
		error.originalError = dbError
		throw error
	}
}