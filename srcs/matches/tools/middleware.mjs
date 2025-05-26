import { fetchTournamentById, fetchMatchById } from './utils.mjs';

export function loadTournament(fastify) {
    return async (req) => {
        const id = req.params.id;

        const tournament = await fetchTournamentById(id);
        if (!tournament)
            throw fastify.httpErrors.notFound('User not found');

        req.tournament = tournament;
    }
}

export function loadMatch(fastify) {
    return async (req) => {
        const id = req.params.id;

        const match = await fetchMatchById(id);
        if (!match)
            throw fastify.httpErrors.notFound('User not found');

        req.match = match;
    }
}
