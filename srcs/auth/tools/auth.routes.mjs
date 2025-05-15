import { loginUser } from './login.mjs'
import { registerUser } from './register.mjs'
import { generateJWT, db } from './utils.mjs'
import { jwtMiddleware } from './middleware.mjs'

export default async function authRoutes(fastify) {
	fastify.addHook('onRequest', (req, reply, done) => {
		req.cookies = {}
		const cookieHeader = req.headers.cookie
		
		if (cookieHeader) {
		  cookieHeader.split(';').forEach(pair => {
			const [key, value] = pair.trim().split('=');
			req.cookies[key] = decodeURIComponent(value)
		  })
		}
		done()
	})

	fastify.post('/register', async (req, reply) => {
		try {
			const result = await registerUser(db, req.body)
			return reply.code(201).send({ success: result.message })
		} catch (error) {
			return reply.code(error.statusCode).send({ error: error.message})
		}
	})
	
	fastify.post('/login', async (req, reply) => {
		try {
			const result = await loginUser(db, req.body)
			if (result.twofa === 'disabled')
				return reply.header('set-cookie', result.cookie).code(200).send({ success: "Login successful" })
			else if (result.twofa === 'enabled')
				return reply.code(200).send({ success: result.message })
		} catch (error) {
			return reply.code(error.statusCode).send({ error: error.message})
		}
	})

	fastify.post('/logout', { preHandler: jwtMiddleware }, async (req, reply) => {
		return reply.header('set-cookie', 'auth=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict').code(200).send({ success: 'Logged out successfully' })
})

	fastify.post('/verify-2fa', async (req, reply) => {
		try {
			const { email, otp } = req.body 
			
			if (!email || !otp)
				return reply.code(400).send({ error: 'Email and OTP are required' })
			
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
				return reply.code(400).send({ error: `Login has been blocked for five minutes due to successive failed attempts`})
			}
			if (user.otp != otp) {
				await db.run(`UPDATE users SET attempts = attempts + 1 WHERE email = ?`, [email])
				return reply.code(400).send({ error: 'Invalid OTP' })
			}
			await db.run(`UPDATE users SET otp = NULL, expire = NULL WHERE email = ?`, [email])

			const token = generateJWT({ userId: user.id, email: user.email })
			const cookie = `auth=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`
			return reply.header('set-cookie', cookie).code(200).send({ success: 'Login successful' })
		}
		catch (error) {
			console.error('2FA verification error:', error)
			return reply.code(500).send({ error: 'Internal Server Error' })
		}
	})

	fastify.post('/set-2fa', { preHandler: jwtMiddleware }, async (req, reply) => {
		const userId = req.user.userId
		const { status } = req.body

		if (status !== 'enabled' && status !== 'disabled')
			return reply.code(400).send({ error: 'Invalid 2FA status' })
		await db.run('UPDATE users SET twofa_status = ? WHERE id = ?', [status, userId]);
		reply.send({ success: `2FA ${status}` })
	})
}