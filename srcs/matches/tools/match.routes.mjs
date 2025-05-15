import crypto from 'crypto';
import { db } from './utils.mjs'

export default async function userRoutes(fastify) {
    const { httpErrors } = fastify;

    fastify.post('/tournaments', {
        preValidation: [fastify.authenticateRequest],
    }, async (req) => {
        try {
            const { name } = req.body;

            if (!name || name === undefined || typeof (name) !== 'string')
                throw httpErrors.unprocessableEntity('Request body is required');

            const id = crypto.randomUUID();

            await db.run('INSERT INTO tournaments (id, name) VALUES (?, ?)', [id, name]);
            return { message: 'Tournament created successfully' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.post('/tournaments/:id/players', {
        preValidation: [fastify.authenticateRequest, fastify.loadTournament],
    }, async (req) => {
        try {
            const userid = req.authUser.id;
            const { alias } = req.body;

            const id = crypto.randomUUID();

            if (!alias || alias === undefined || typeof (alias) !== 'string')
                throw httpErrors.unprocessableEntity('Request body is required');

            await db.run('INSERT INTO players (id, alias, tournament_id, user_id) VALUES (?, ?, ?, ?)', [id, alias, req.tournament.id, userid]);
            return { message: 'Player added to tournament successfully' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });
}
