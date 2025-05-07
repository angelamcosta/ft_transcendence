import { hashPassword, generateJWT } from "./utils.mjs"
import { sendEmail } from "./emailService.mjs"

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
	
	if (user.twofa_status === 'enabled') {
		await db.run(`UPDATE users SET otp = NULL, expire = NULL WHERE email = ?`, [email])
		const otp_code = Math.floor(100000 + Math.random() * 900000)
		const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
		await db.run(`UPDATE users SET otp = ?, expire = ? WHERE email = ?`, [otp_code, expiresAt, email])
		sendEmail(email, otp_code)
		return ({ message: 'Verification code sent', twofa: 'enabled' })
	}

	const token = generateJWT({ userId: user.id, email: user.email })
	return ({ cookie: `auth=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`, twofa: 'disabled' })
}