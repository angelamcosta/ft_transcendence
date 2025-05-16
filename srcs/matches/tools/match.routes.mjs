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

            if (req.tournament.status !== 'open')
                throw fastify.httpErrors.forbidden('Tournament is not accepting new players');

            const existing = await db.get('SELECT id FROM players WHERE tournament_id = ? and user_id = ?', [req.tournament.id, userid]);

            if (existing)
                throw httpErrors.conflict('Player already registered in this tournament');

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

    fastify.get('/tournaments/:id/matches', {
        preValidation: [fastify.authenticateRequest, fastify.loadTournament],
    }, async (req) => {
        try {
            const matches = await db.all('SELECT m.id, p1.alias as player1_alias, p2.alias as player2_alias, m.status, m.score, m.created_at FROM matches m LEFT JOIN players p1 ON m.player1_id = p1.id LEFT JOIN players p2 ON m.player2_id = p2.id WHERE m.tournament_id = ? ORDER BY m.created_at DESC', [req.tournament.id]);
            return { matches };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.post('/matches/:id/result', {
        preValidation: [fastify.authenticateRequest, fastify.loadMatch],
    }, async (req) => {
        try {
            const { winnerId, score } = req.body;
            const match = req.match;

            if (![match.player1_id, match.player2_id].includes(winnerId))
                throw httpErrors.unprocessableEntity('Invalid winnerId: not a player in this match');

            if (typeof winnerId !== 'string' || typeof score !== 'string')
                throw httpErrors.unprocessableEntity('winnerId and score are required');

            if (match.status === 'finished')
                throw httpErrors.conflict('Match is already finished');

            const loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id;

            await db.transaction(async (tx) => {
                await tx.run('UPDATE matches SET winner_id = ?, score = ?, status = ? WHERE id = ?', [winnerId, score, 'finished', match.id]);

                await tx.run('UPDATE players SET status = ? WHERE id = ?',  ['winner', winnerId]);
                await tx.run('UPDATE players SET status = ? WHERE id = ?',  ['loser', loserId]);
            });

            return { "success": true };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.get('/matches/:id', {
        preValidation: [fastify.authenticateRequest]
    }, async (req) => {
        try {
            const match = await db.get('SELECT m.*, p1.alias as player1_alias, p2.alias as player2_alias, w.alias as winner_alias FROM matches m LEFT JOIN players p1 ON m.player1_id = p1.id LEFT JOIN players p2 ON m.player2_id = p2.id LEFT JOIN players w ON m.winner_id = w.id WHERE m.id = ?', [req.params.id]);
            return { match };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });
}
