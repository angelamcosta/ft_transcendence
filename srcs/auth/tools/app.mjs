import Fastify from 'fastify';
import userRoutes from './user.routes.mjs';

const app = Fastify({ logger: true })
const PORT = 4000

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
	err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT}`)
})

app.register(userRoutes)