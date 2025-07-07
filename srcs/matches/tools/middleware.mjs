import { fetchTournamentById, fetchMatchById } from './utils.mjs';

export async function validateEmptyBody(res, rep) {
    if (request.raw.method !== 'POST') return;

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
