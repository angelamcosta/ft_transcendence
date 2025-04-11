import { db } from './utils.mjs'

export default async function userRoutes(fastify) {
    fastify.get('/users/', {
        preValidation: [fastify.validateMethod],
    }, async (req, res) => {
        try {
            const users = await db.all('SELECT id, display_name FROM users');
            return res.send(users);
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw fastify.httpErrors.internalServerError('Failed to fetch users');
        }
    });

    fastify.get('/users/:id', {
        preValidation: [fastify.validateUser, fastify.validateMethod],
        preHandler: [fastify.loadUser],
    }, async (req, res) => {
        return res.send(req.user);
    });

    fastify.put('/users/:id', {
        preValidation: [fastify.validateUser, fastify.validateMethod],
        preHandler: [fastify.loadUser],
    }, async (req) => {
        const { email, display_name } = req.body;
        const updates = [];
        const params = [];

        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }

        if (display_name !== undefined) {
            updates.push('display_name = ?');
            params.push(display_name);
        }

        params.push(req.params.id);

        try {
            await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
            return { message: 'User updated successfully' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw fastify.httpErrors.internalServerError('Database update failed');
        }
    });
}