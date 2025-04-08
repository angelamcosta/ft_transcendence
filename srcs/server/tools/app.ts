import Fastify from 'fastify'

const app = Fastify({ logger: true })

app.get('/', async () => {
	return { message: 'Success!' }
})

const listeners = ['SIGINT', 'SIGTERM']
listeners.forEach((signal) => {
	process.on(signal, async () => {
		await app.close()
		process.exit(0)
	})
})

app.listen({ port: 9000, host: '0.0.0.0' }, (err: Error | null) => {
	err ? (console.error(err), process.exit(1)) : console.log('Server running on port 3000')
})