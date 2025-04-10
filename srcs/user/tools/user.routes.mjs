import { db } from './utils.mjs'
import { validateMethod, loadUser, validateUser } from './middleware.mjs'

export default async function userRoutes(fastify) {
    fastify.addHook('preHandler', validateMethod(fastify));
    fastify.addHook('preHandler', loadUser(fastify));
    fastify.addHook('preHandler', validateUser(fastify));

    fastify.get('/users/:id', async (req, res) => {
        return res.send(req.user);
    });

    fastify.put('/users/:id', async (req) => {
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