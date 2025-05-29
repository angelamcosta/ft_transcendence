import fs from 'fs';
import path from 'path';
import { fetch } from 'undici'
import cors from '@fastify/cors'
import Fastify from 'fastify/fastify.js'

const KEY = process.env.SERVER_KEY;
const CERT = process.env.SERVER_CERT;
const PORT = process.env.SERVER_PORT;
const AUTH_URL = process.env.AUTH_URL;
const USER_URL = process.env.USER_URL
const __dirname = new URL('.', import.meta.url).pathname;

const app = Fastify({ 
	logger: true,
	ignoreTrailingSlash: true,
	https: {
		key: fs.readFileSync(path.join(__dirname, KEY)),
		cert: fs.readFileSync(path.join(__dirname, CERT)),
	},
})

await app.register(cors, {
	origin: 'https://localhost:5173',
	credentials: true
})

const listeners = ['SIGINT', 'SIGTERM']
listeners.forEach((signal) => {
	process.on(signal, async () => {
		await app.close();
		process.exit(0);
	});
})

app.get('/', async function handler(request, reply) {
	return { message: 'Success!' }
})

app.post('/register', async (req, reply) => {
	try {
		const res = await fetch(`${AUTH_URL}/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(req.body)
		})
		const data = await res.json()
		reply.code(res.status).send(data)
	} catch (error) {
		console.error('Proxy error: ', error);
		reply.code(500).send({error: 'Server proxy error'})
	}
})

app.post('/logout', async (req, reply) => {
	try {
		const res = await fetch(`${AUTH_URL}/logout`, {
			method: 'POST'
		});
		const body = await res.json()
		reply.header('set-cookie', 'auth=; Path=/; HttpOnly; Secure; Max-Age=0; SameSite=Strict').code(res.status).send(body)
	} catch (error) {
		console.error('Logout proxy error:', error)
		reply.code(500).send({error: 'Proxy error during logout'})
	}
})

app.post('/login', async (req, reply) => {
	try {
		const res = await fetch(`${AUTH_URL}/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'cookie': req.headers.cookie
			},
			body: JSON.stringify(req.body)
		});

		const body = await res.json();
		const setCookie = res.headers.get('set-cookie')
		if (setCookie)
			reply.header('set-cookie', setCookie)
		reply.code(res.status).send(body)
	} catch (error) {
		console.error('Login proxy error:', error)
		reply.code(500).send({error: 'Proxy error during login'})
	}
})

app.post('/set-2fa', async (req, reply) => {
	try {
		const res = await fetch(`${AUTH_URL}/set-2fa`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'cookie': req.headers.cookie
			},
			body: JSON.stringify(req.body)
		})
		const body = await res.json()
		reply.code(res.status).send(body)
	} catch (error) {
		console.error('2FA Error: ', error)
		reply.code(500).send({error: 'Error setting 2fa'})
	}
})

app.post('/verify-2fa', async (req, reply) => {
	try {
		const res = await fetch(`${AUTH_URL}/verify-2fa`, {
			method: 'POST',
			headers: {
				'Content-type': 'application/json',
				'cookie': req.headers.cookie
			},
			body: JSON.stringify(req.body)
		})

		const setCookie = res.headers.get('set-cookie')
		const body = await res.json()

		if (setCookie)
			reply.header('set-cookie', setCookie)
		reply.code(res.status).send(body)
	} catch (error) {
		console.error('2FA Error: ', error)
		reply.code(500).send({error: 'Error with OTP server'})
	}
})

app.get('/users', async (req, reply) => {
	try {
		const res = await fetch(`${USER_URL}/users`, {
			method: 'GET',
			headers: {
				'Content-type': 'application/json',
				'cookie': req.headers.cookie
			},
		})

		const body = await res.json()
		reply.code(res.status).send(body)
	} catch (error) {
		console.error('Error listing users: ', error)
		reply.code(500).send({error: 'Error while fetching users'})
	}
})

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
	err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT}`)
})