import { loginUser } from './login.mjs';
import { registerUser } from './register.mjs';
import { verifyJWT, db } from './utils.mjs';

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

	fastify.addHook('preHandler', async (req, reply) => {
		if (req.url === '/verify') {
			try {
				const token = req.cookies.auth;
				if (!token) {
					return reply.code(401).send({ error: 'Missing token' })
				}
				
				req.user = verifyJWT(token);
			} catch (error) {
				return reply.code(401).send({ error: error.message === 'Token expired' ? 'Invalid signature' : 'Invalid token' })
			}
		}
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
			const { cookie } = await loginUser(db, req.body)
			return reply.header('set-cookie', cookie).code(200).send({ success: "Login successful" })
		} catch (error) {
			return reply.code(error.statusCode).send({ error: error.message})
		}
	})

	fastify.post('/verify-email', async (req, reply) => {
		try {
			const { email, otp } = req.body

			if (!email || !otp)
				return reply.code(400).send({ error: 'Email and OTP are required' })

			const user = await db.get('SELECT otp, expire, twofa_verify from USERS where email = ?', [email])
			if (!user)
				return reply.code(400).send({ error: 'User not found'})
			if (user.twofa_verify == 'verified')
				return reply.code(400).send({ error: 'Email already verified'})

			const now = new Date()
			if (now > user.expire)
				return reply.code(400).send({ error: 'Verification code has expired'})
			if (user.otp != otp)
				return reply.code(400).send({ error: 'Verification code is invalid'})

			await db.run(`UPDATE users SET twofa_verify = 'verified', twofa_status = 'enabled', otp = NULL, expire = NULL WHERE email = ?`, [email])

			return reply.send({ success: 'Email verified successfully' })
		}
		catch (error) {
			console.error('Verification error:', error)
			return reply.code(500).send({ error: 'Internal Server Error' })
		}
	})

	fastify.get('/verify', async (req, reply) => {
		try {
			const user = await db.get('SELECT id, email FROM users WHERE id = ?', [req.user.userId])
			if (!user) {
				const error = new Error('No user found with this ID')
				error.statusCode = 404
				throw error
			}
			return reply.send({ user })
		} catch (error) {
			return reply.code(500).send({ error: 'Internal Server Error'})
		}
	})
}