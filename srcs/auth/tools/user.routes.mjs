import { loginUser } from './login.mjs';
import { registerUser } from './register.mjs';
import { verifyJWT, db } from './utils.mjs';

export default async function userRoutes(fastify) {
	fastify.addHook('onRequest', (req, reply, done) => {
		req.cookies = {};
		const cookieHeader = req.headers.cookie;
		
		if (cookieHeader) {
		  cookieHeader.split(';').forEach(pair => {
			const [key, value] = pair.trim().split('=');
			req.cookies[key] = decodeURIComponent(value);
		  });
		}
		done();
	})

	fastify.addHook('preHandler', async (req, reply) => {
		if (req.url.startsWith('/verify')) {
			try {
				const token = req.cookies.auth;
				if (!token) {
					return reply.code(401).send({ error: 'Missing token' });
				}
				
				req.user = verifyJWT(token);
			} catch (error) {
				return reply.code(401).send({ error: error.message === 'Token expired' ? 'Invalid signature' : 'Unauthorized' });
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
			return reply.header('set-cookie', cookie).code(200).send({ success: "Login successful" });
		} catch (error) {
			return reply.code(error.statusCode).send({ error: error.message})
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
			return reply.code(500).send({ error: 'Internal Server Error'});
		}
	})
}