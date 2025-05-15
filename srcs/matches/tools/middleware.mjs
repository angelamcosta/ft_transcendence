import { fetchTournamentById } from './utils.mjs';

export function loadTournament(fastify) {
    return async (req) => {
        const id = req.params.id;

        const tournament = await fetchTournamentById(id);
        if (!tournament)
            throw fastify.httpErrors.notFound('User not found');

        req.tournament = tournament;
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

            const response = await fetch('http://auth:4000/verify', {
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
