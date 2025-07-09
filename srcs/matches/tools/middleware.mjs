import { fetchTournamentById, fetchMatchById } from './utils.mjs';
import { fetch, Agent as UndiciAgent } from 'undici';

const tlsAgent = new UndiciAgent({
	connect: { rejectUnauthorized: false }
});

export async function validateEmptyBody(res, rep) {
	if (res.raw.method !== 'POST') return;

	const body = res.body;

	if (body === undefined || Object.keys(body).length === 0)
		return rep.code(400).send({ error: 'JSON body is empty' });
}

export function loadTournament(fastify) {
	return async (req) => {
		const id = req.params.id;
		const tournament = await fetchTournamentById(id);

		if (!tournament)
			throw fastify.httpErrors.notFound(`Tournament with ${id} not found`);
		req.tournament = tournament;
	}
}

export function loadMatch(fastify) {
	return async (req) => {
		const id = req.params.id;
		const match = await fetchMatchById(id);

		if (!match)
			throw fastify.httpErrors.notFound(`Match with ${id} not found`);
		req.match = match;
	}
}

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
				throw fastify.httpErrors.serviceUnavailable('Auth request timed out');
			else
				console.error('Auth request failed:', err);
			throw fastify.httpErrors.unauthorized('Auth failed');
		}
	};
}