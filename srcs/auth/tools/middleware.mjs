export async function authenticate(req, reply) {
	try {
		console.log('cookies:', req.cookies)
		await req.jwtVerify()
	} catch (err) {
		return reply.code(401).send({ error: 'Invalid or expired token' })
	}
}