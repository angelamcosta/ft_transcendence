import Fastify from 'fastify/fastify.js'
import { fetch } from 'undici'
import cors from '@fastify/cors'

const app = Fastify({ logger: true })
const PORT = process.env.SERVER_PORT;
const AUTH_URL = process.env.AUTH_URL;

console.log('AUTH_URL =', AUTH_URL);
console.log('PORT =', PORT);


await app.register(cors, {
	origin: 'http://localhost:5173',
	credentials: true
});

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
		console.log('Proxy error: ', error);
		reply.code(500).send({error: 'Server proxy error'})
	}
})

app.post('/login', async (req, reply) => {
	try {
		const response = await fetch(`${AUTH_URL}/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'cookie': req.headers.cookie
			},
			body: JSON.stringify(req.body)
		});

		const body = await response.json();
		const setCookie = response.headers.get('set-cookie');
		console.log(setCookie)
		if (!setCookie) {
			const error = new Error('Interal Server Error')
			error.statusCode = 500
			throw error
		}
		reply.header('set-cookie', setCookie)
		reply.code(response.status).send(body)
	} catch (error) {
		console.error('Login proxy error:', error);
		reply.code(500).send({ error: 'Proxy error during login' })
	}
});

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
	err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT}`)
})