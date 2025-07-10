import { inSession, verifyPassword } from "./utils.mjs"
import { sendEmail } from "./emailService.mjs"

export async function loginUser(db, {email, password}) {
	if (!email || !password) {
		const error = new Error('Missing fields')
		error.statusCode = 400
		throw error
	}

	email = email.toLowerCase();
	const user = await db.get('SELECT * FROM users where email = ?', [email])
	if (!user) {
		const error = new Error('Invalid email or password')
		error.statusCode = 401
		throw error
	}

	const validPassword = await verifyPassword(password, user.password);
	if (!validPassword) {
		const error = new Error('Invalid email or password')
		error.statusCode = 401
		throw error
	}

	if (user.twofa_status === 'enabled') {
		await inSession(user.id);
		const otp_code = Math.floor(100000 + Math.random() * 900000)
		const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

		await db.run(`UPDATE users SET otp = ?, expire = ? WHERE email = ?`, [otp_code, expiresAt, email])
		const emailSent = await sendEmail(email, otp_code)
		if (!emailSent) {
			await db.run(`UPDATE users SET otp = NULL, expire = NULL WHERE email = ?`, [email])
			return ({ message: 'Failed to send verification code. Please try again later', twofa: 'failed' })
		}
		return ({
			message: 'Verification code sent',
			twofa: 'enabled',
			user: {
				id: user.id, 
				displayName: user.display_name, 
				email: user.email
			}
		 })
	}

	return ({ 
		twofa: 'disabled', 
		user: {id: user.id, displayName: user.display_name, email: user.email}
	})
}