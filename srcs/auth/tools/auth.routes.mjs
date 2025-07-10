import { loginUser } from './login.mjs'
import { registerUser } from './register.mjs'
import { db, inSession } from './utils.mjs'
import { sendLink , resetPassword } from './reset.mjs'

export default async function authRoutes(fastify) {
	fastify.post('/register', async (req, reply) => {
		try {
			const result = await registerUser(db, req.body)
			return reply.code(201).send({ success: result.message })
		} catch (error) {
			return reply.code(error.statusCode).send({ error: error.message })
		}
	})

	fastify.post('/login', async (req, reply) => {
		try {
			const result = await loginUser(db, req.body)
			const { user, twofa, message } = result;

			if (result.twofa === 'failed')
				return reply.code(500).send({ error: message })
			if (result.twofa === 'enabled')
				return reply.code(200).send({ success: message, user, twofa })

			await inSession(user.id);
			const token = await reply.jwtSign(
				{ userId: user.id, email: user.email },
				{ expiresIn: '1h' }
			)

			return reply.code(200).setCookie('auth', token, {
				httpOnly: true,
				secure: true,
				sameSite: 'Strict',
				path: '/',
				maxAge: 3600
			}).send({ success: 'Login successful', user, twofa })
		} catch (error) {
			return reply.code(error.statusCode || 500).send({ error: error.message })
		}
	})

	fastify.post('/send-link', async (req, reply) => {
		try {
			const result = await sendLink(db, req.body, fastify)
			return reply.code(201).send({ success: result.message })
		} catch (error) {
			return reply.code(error.statusCode).send({ error: error.message })
		}
	})

	fastify.post('/reset-password', async (req, reply) => {
		try {
			const result = await resetPassword(db, req.body)
			return reply.code(201).send({ success: result.message })
		} catch (error) {
			return reply.code(error.statusCode).send({ error: error.message })
		}
	})

	fastify.post('/logout', { preValidation: fastify.authenticate }, async (req, reply) => {
		await db.run(
			'UPDATE users SET session_id = NULL WHERE id = ?',
			[req.user.userId]
		);
		reply.clearCookie('auth', {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'Strict'
		}).code(200).send({ success: 'Logged out successfully' })
	})

	fastify.post('/verify-2fa', async (req, reply) => {
		try {
			let { email, otp } = req.body

			email = email.toLowerCase()
			if (!email || !/^\d{6}$/.test(otp))
				return reply.code(400).send({ error: 'Invalid OTP format' })

			const user = await db.get('SELECT * FROM users WHERE email = ?', [email])
			if (!user || user.twofa_status !== 'enabled')
				return reply.code(401).send({ error: 'Invalid OTP request' })
			let blocked = user.temp_blocked
			if (!user.otp || !user.expire)
				return reply.code(401).send({ error: 'No pending OTP verification' })
			const now = new Date();
			if (now > new Date(user.expire))
				return reply.code(401).send({ error: 'OTP has expired' })
			if (user.temp_blocked && now < new Date(user.temp_blocked))
				return reply.code(429).send({ error: 'Too many attempts, try again later' })
			if (user.attempts >= 4) {
				if (!user.temp_blocked) {
					blocked = new Date(Date.now() + 1 * 60 * 1000).toISOString()
					await db.run(`UPDATE users SET temp_blocked = ? WHERE email = ?`, [blocked, email])
				}
				return reply.code(429).send({ error: `Login has been blocked for five minutes due to successive failed attempts` })
			}
			if (user.otp != otp) {
				await db.run(`UPDATE users SET attempts = attempts + 1 WHERE email = ?`, [email])
				return reply.code(401).send({ error: 'Invalid OTP' })
			}
			await db.run(`UPDATE users SET otp = NULL, expire = NULL, attempts = 0, temp_blocked = 0 WHERE email = ?`, [email])
			
			const token = await reply.jwtSign(
				{ userId: user.id, email: user.email },
				{ expiresIn: '1h' }
			)
			return reply.code(200).setCookie('auth', token, {
				httpOnly: true,
				secure: true,
				sameSite: 'Strict',
				path: '/',
				maxAge: 3600
			}).send({ success: 'Login successful' })
		}
		catch (error) {
			console.error('2FA verification error:', error)
			return reply.code(500).send({ error: 'Internal Server Error' })
		}
	})

	fastify.post('/set-2fa', { preValidation: fastify.authenticate }, async (req, reply) => {
		const userId = req.user.userId
		const { status } = req.body
		const user = await db.get('SELECT twofa_status FROM users WHERE id = ?', [userId])

		if (user.twofa_status === 'enabled' && status === 'enabled')
			return reply.code(409).send({ error: '2FA is already enabled for this user' })
		if (user.twofa_status === 'disabled' && status === 'disabled')
			return reply.code(409).send({ error: '2FA is already disabled for this user' })
		if (status !== 'enabled' && status !== 'disabled')
			return reply.code(400).send({ error: 'Invalid 2FA status' })
		await db.run('UPDATE users SET twofa_status = ? WHERE id = ?', [status, userId]);
		reply.send({ success: `2FA ${status}` })
	});

	fastify.get('/verify-reset-token', async (req, reply) => {
		try {
			const token = req.headers['token'];

			if(!token)
				return reply.code(400).send({ error: 'Invalid token' });
			const user = await db.get('SELECT * FROM reset_password WHERE token = ?', [token]);
			if (!user)
				return reply.code(401).send({ error: 'Invalid token' });
			const now = new Date();
			if (now > new Date(user.expire)) {
				await db.run('DELETE FROM reset_password WHERE token = ?', [token]);
				return reply.code(401).send({ error: 'Token has expired' })
			}
			
			return reply.code(200).send({ success: 'Token is valid' });
		}
		catch (error) {
			console.error('Reset token verification error:', error)
			return reply.code(500).send({ error: 'Internal Server Error' })
		}
	})

	fastify.get('/verify', { preValidation: fastify.authenticate }, async (req, reply) => {
		const now = Math.floor(Date.now() / 1000)

		if (req.user.exp - now < 5 * 60) {
			const token = await reply.jwtSign(
				{ userId: req.user.userId, email: req.user.email },
				{ expiresIn: '1h' }
			)

			reply.setCookie('auth', token, {
				httpOnly: true,
				secure: true,
				sameSite: 'Strict',
				path: '/',
				maxAge: 3600
			})
		}

		return reply.code(200).send({
			success: 'Token is valid',
			user: {
				id: req.user.userId,
				email: req.user.email
			}
		});
	});
}