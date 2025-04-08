import Fastify from 'fastify/fastify.js'

const app = Fastify({ logger: true })
const PORT = 9000

const listeners = ['SIGINT', 'SIGTERM']
listeners.forEach((signal) => {
	process.on(signal, async () => {
		await app.close()
		process.exit(0)
	})
})

app.get('/', async function handler(request, reply) {
	return { message: 'Success!' }
})

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
	err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT} 3000`)
})