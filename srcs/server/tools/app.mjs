import Fastify from 'fastify/fastify.js'
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({ logger: true })
const PORT = process.env.SERVER_PORT;

app.register(fastifyStatic, {
	root: path.join(__dirname, 'public'),
	prefix: '/', // optional: makes files available at "/"
  });

const listeners = ['SIGINT', 'SIGTERM']
listeners.forEach((signal) => {
	process.on(signal, async () => {
		await app.close();
		process.exit(0);
	});
})

app.get('/', async function handler(request, reply) {
	return reply.sendFile('index.html');
})

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
	err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT} 3000`);
})