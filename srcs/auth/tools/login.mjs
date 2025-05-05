import { hashPassword, generateJWT } from "./utils.mjs"

export async function loginUser(db, {email, password}) {
	if (!email || !password) {
		const error = new Error('Missing fields')
		error.statusCode = 400
		throw error
	}

	const user = await db.get('SELECT * FROM users where email = ?', [email])
	if (!user) {
		const error = new Error('Invalid credentials')
		error.statusCode = 401
		throw error
	}
	
	const { hash } = hashPassword(password, user.salt)
	if (hash !== user.passwordHash) {
		const error = new Error('Invalid credentials')
		error.statusCode = 401
		throw error
	}
	console.log(`'twofa verify -> ${user.twofa_verify}'`)
	if (user.twofa_verify == 'pending') {
		const error = new Error('Email is not verified')
		error.statusCode = 401
		throw error
	}
		
	const token = generateJWT({ userId: user.id, email: user.email })
	
	return ({ cookie: `auth=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600` })
}