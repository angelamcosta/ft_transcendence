import { hashPassword } from './utils.mjs';

export async function registerUser(db, {email, password, display_name}) {
	if (!email || !password || !display_name) {
		const error = new Error('Missing fields')
		error.statusCode = 400
		throw error
	}

	if (/\s/.test(email) || /\s/.test(password) || /\s/.test(display_name)) {
		const error = new Error('Fields must not contain whitespaces')
		error.statusCode = 400
		throw error
	}

	if (email.length > 128 || password.length > 128 || display_name.length > 128) {
		const error = new Error(`Fields can't contain more than 128 characters`)
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

	const displayNameExists = await db.get('SELECT id FROM users where display_name = ?', [display_name])
	if (displayNameExists) {
		const error = new Error('Display name already in use')
		error.statusCode = 409
		throw error
	}

	const { hash } = await hashPassword(password)
	try {
		await db.run(`INSERT INTO users (email, password, twofa_status, display_name) VALUES (?, ?, 'disabled', ?)`, [email, hash, display_name])
		return { message: 'Registration successful' }
	} catch (dbError) {
		console.log('Database error details:', dbError)
		const error = new Error('Registration failed')
		error.statusCode = 500
		error.originalError = dbError
		throw error
	}
}