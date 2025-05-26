import Fastify from 'fastify';
import authRoutes from './auth.routes.mjs';

const app = Fastify({ logger: true })
const PORT = process.env.AUTH_PORT

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
	err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT}`)
})

app.register(authRoutes)


// TODO:
// A way to resend a code after OTP has expired