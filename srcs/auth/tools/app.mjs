import Fastify from 'fastify';
import authRoutes from './auth.routes.mjs';

const KEY = process.env.AUTH_KEY
const CERT = process.env.AUTH_CERT
const PORT = process.env.AUTH_PORT

const app = Fastify({ 
	logger: true,
	ignoreTrailingSlash: true,
	https: {
		key: fs.readFileSync(path.join(__dirname, KEY)),
		cert: fs.readFileSync(path.join(__dirname, CERT)),
	},
})

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
	err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT}`)
})

app.register(authRoutes)

// TODO:
// A way to resend a code after OTP has expired