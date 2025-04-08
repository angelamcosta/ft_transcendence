import Fastify from 'fastify'
import userRoutes from './user.routes.mjs'

const app = Fastify({ logger: true });
const PORT = process.env.USER_PORT;

const listeners = ['SIGINT', 'SIGTERM']
listeners.forEach((signal) => {
	process.on(signal, async () => {
		await app.close();
		process.exit(0);
	});
});

app.register(userRoutes);

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
	err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT}`);
})