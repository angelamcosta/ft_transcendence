import { loginUser } from './login.mjs'
import { registerUser } from './register.mjs'
import { db } from './utils.mjs'

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
			const { user, twofa, message} = result;

			if (result.twofa === 'failed')
				return reply.code(500).send({ error: message })
			if (result.twofa === 'enabled')
				return reply.code(200).send({ success: message, user, twofa })

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
			}).send({ success: 'Login successful', user, twofa})
		} catch (error) {
			return reply.code(500).send({ error: error.message })
		}
	})

	fastify.post('/logout', async (req, reply) => {
		return reply.header('set-cookie', 'auth=; Path=/; HttpOnly; Secure; Max-Age=0; SameSite=Strict').code(200).send({ success: 'Logged out successfully' })
	})

	fastify.post('/verify-2fa', async (req, reply) => {
		try {
			const { email, otp } = req.body

			if (!email || !otp)
				return reply.code(400).send({ error: 'Invalid OTP Request' })

			const user = await db.get('SELECT * FROM users WHERE email = ?', [email])
			if (!user)
				return reply.code(400).send({ error: 'User not found' })
			let blocked = user.temp_blocked
			if (user.twofa_status !== 'enabled')
				return reply.code(400).send({ error: '2FA not enabled for this user' })
			if (!user.otp || !user.expire)
				return reply.code(400).send({ error: 'No pending OTP verification' })
			const now = new Date();
			if (now > new Date(user.expire))
				return reply.code(400).send({ error: 'OTP has expired' })
			if (user.temp_blocked && now > new Date(user.temp_blocked)) {
				await db.run(`UPDATE users SET attempts = 0, temp_blocked = NULL WHERE email = ?`, [email])
				user.attempts = 0;
				user.temp_blocked = null;
			}
			if (user.attempts >= 4) {
				if (!user.temp_blocked) {
					blocked = new Date(Date.now() + 1 * 60 * 1000).toISOString()
					await db.run(`UPDATE users SET temp_blocked = ? WHERE email = ?`, [blocked, email])
				}
				return reply.code(400).send({ error: `Login has been blocked for five minutes due to successive failed attempts` })
			}
			if (user.otp != otp) {
				await db.run(`UPDATE users SET attempts = attempts + 1 WHERE email = ?`, [email])
				return reply.code(400).send({ error: 'Invalid OTP' })
			}
			await db.run(`UPDATE users SET otp = NULL, expire = NULL WHERE email = ?`, [email])

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
			}).send({ success: 'Login successful'})
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
			return reply.code(400).send({ error: '2FA is already enabled for this user' })
		if (user.twofa_status === 'disabled' && status === 'disabled')
			return reply.code(400).send({ error: '2FA is already disabled for this user' })
		if (status !== 'enabled' && status !== 'disabled')
			return reply.code(400).send({ error: 'Invalid 2FA status' })
		await db.run('UPDATE users SET twofa_status = ? WHERE id = ?', [status, userId]);
		reply.send({ success: `2FA ${status}` })
	});

	fastify.get('/verify', { preValidation: fastify.authenticate }, async (req, reply) => {
		return reply.code(200).send({
			success: 'Token is valid',
			user: {
				id: req.user.userId,
				email: req.user.email
			}
		});
	});
}