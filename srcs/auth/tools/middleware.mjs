import { verifyJWT } from './utils.mjs'

export async function jwtMiddleware(req, reply) {
	const cookieHeader = req.headers.cookie

	if (!cookieHeader) {
		return reply.code(401).send({ error: 'Missing authentication cookie' })
	}

	const match = cookieHeader.match(/auth=([^;]+)/)
	if (!match) {
		return reply.code(401).send({ error: 'Auth token not found' })
	}

	const token = decodeURIComponent(match[1])

	try {
		const userData = verifyJWT(token)
		req.user = userData
	} catch (err) {
		return reply.code(401).send({ error: 'Invalid or expired token' })
	}
}