import { db } from 'utils.mjs'

export default async function userRoutes(fastify, option) {
    fastify.addHook('preHandler', async (req, res) => {
        if (req.params.id) {
            const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
            if (!user) throw fastify.httpErrors.notFound('User not found');
            req.user = user;
        }
    })

    fastify.get('/users/:id', async (req, res) => {
        return res.send(req.user);
    });

    fastify.put('/users/:id', async (req, res) => {
        const { email, display_name } = req.body;

        if (email === undefined && display_name === undefined)
            throw fastify.httpErrors.badRequest('No fields provided');

        const updates = [];
        const params = [];

        if (email !== undefined) {
            if (!email.includes('@')) throw fastify.httpErrors.badRequest('Invalid email');
            updates.push('email = ?');
            params.push(email);
        }

        if (display_name !== undefined) {
            if (display_name.length > 20) throw fastify.httpErrors.badRequest('Display name too long');
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