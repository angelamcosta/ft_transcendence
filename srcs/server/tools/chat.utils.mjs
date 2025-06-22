import { fetch, Agent as UndiciAgent } from 'undici';

const tlsAgent = new UndiciAgent({
	connect: { rejectUnauthorized: false }
});

export function authenticateRequest(fastify) {
	return async (req) => {
		const token = req.cookies?.auth;
		if (!token)
			throw fastify.httpErrors.unauthorized('Unauthorized');

		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 5000);

			const response = await fetch('https://auth:4000/api/verify', {
				dispatcher: tlsAgent,
				method: 'GET',
				headers: { 'cookie': `auth=${token}` },
				signal: controller.signal
			});

			clearTimeout(timeout);

			if (!response.ok) {
				console.error(`Auth service responded with status: ${response.status}`);
				throw fastify.httpErrors.unauthorized('Invalid token');
			}

			const data = await response.json();
			req.authUser = data.user;
		} catch (err) {
			if (err.name === 'AbortError')
				console.error('Auth request timed out');
			else
				console.error('Auth request failed:', err);
			throw fastify.httpErrors.unauthorized('Auth failed');
		}
	};
}