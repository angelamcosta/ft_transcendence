import Fastify from 'fastify';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { loginUser } from './login.mjs';
import { registerUser } from './register.mjs';
import { verifyJWT } from './auth-utils.mjs';

const db = await open({
	filename: process.env.DB_PATH,
	driver: sqlite3.Database
});

const app = Fastify({ logger: true })
const PORT = 4000

// app.get('/health', async (req, reply) => {
// 	return { 
// 		status: 'OK', 
// 		timestamp: new Date().toISOString(),
// 		db: await checkDbHealth()  // Optional: Verify DB connection
// 	  };
// });

// async function checkDbHealth() {
// 	try {
// 		await db.get('SELECT 1');  // Simple query to test DB
// 		return 'connected';
// 	  } catch (err) {
// 		return 'disconnected';
// 	  }
// }

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
	err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT}`)
})

app.addHook('onRequest', (req, reply, done) => {
	req.cookies = {};
	const cookieHeader = req.headers.cookie;
	
	if (cookieHeader) {
	  cookieHeader.split(';').forEach(pair => {
		const [key, value] = pair.trim().split('=');
		req.cookies[key] = decodeURIComponent(value);
	  });
	}
	done();
  });

app.post('/register', async (req, reply) => {
	try {
		const result = await registerUser(db, req.body)
		return reply.code(201).send({ success: result.message })
	} catch (error) {
		const statusCode = error.statusCode
		return reply.code(statusCode).send({ error: error.message})
	}
})

app.post('/login', async (req, reply) => {
	try {
		const { cookie } = await loginUser(db, req.body)
		return reply.header('set-cookie', cookie).code(200).send({ success: "Login successful" });
	} catch (error) {
		const statusCode = error.statusCode
		return reply.code(statusCode).send({ error: error.message})
	}
})

app.get('/verify', async (req, reply) => {
	try {
		const token = req.cookies.auth
		console.log(token)
		if (!token) {
			const error = new Error('Missing token')
       		error.statusCode = 401
        	throw error
		}

		const decoded = verifyJWT(token)
		const user = await db.get('SELECT id, email FROM users WHERE id = ?', [decoded.userId])

		return reply.send({ user })
	} catch (error) {
		return reply.code(401).send({ error: 'Unauthorized'});
	}
})