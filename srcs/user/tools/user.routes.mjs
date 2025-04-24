import { db } from './utils.mjs'

export default async function userRoutes(fastify) {
    // ! /users
    fastify.get('/users/', {
        preValidation: [fastify.validateMethod],
    }, async (req, res) => {
        try {
            const users = await db.all('SELECT id, display_name FROM users');
            return res.send(users);
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw fastify.httpErrors.internalServerError('Failed to fetch users: ' + err.message);
        }
    });

    fastify.get('/users/:id', {
        preValidation: [fastify.validateMethod],
        preHandler: [fastify.loadUser],
    }, async (req, res) => {
        return res.send(req.user);
    });

    fastify.post('/users/:id', {
        preValidation: [fastify.validateData, fastify.validateMethod],
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
            throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.delete('/users/:id', {
        preValidation: [fastify.validateMethod],
        preHandler: [fastify.loadUser]
    }, async (req) => {
        try {
            await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
            return { message: 'User delete successfully' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw fastify.httpErrors.internalServerError('Failed to delete user: ' + err.message);
        }
    })

    // ! avatar
    fastify.get('/users/:id/avatar', {
        preValidation: [fastify.validateMethod],
        preHandler: [fastify.loadAvatar],
    }, async (req, res) => {
        return res.send(req.avatar);
    });

    fastify.put('/users/:id/avatar', {
        preValidation: [fastify.validateMethod],
        preHandler: [fastify.loadUser],
    }, async (req) => {
        const { avatar } = req.body;

        if (typeof avatar !== 'string' || avatar.trim() === '')
            throw fastify.httpErrors.badRequest('Invalid avatar');

        try {
            await db.run(`UPDATE users SET avatar = ? WHERE id = ?`, [avatar, req.params.id]);
            return { message: 'Avatar updated successfully' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.delete('/users/:id/avatar', {
        preValidation: [fastify.validateMethod],
        preHandler: [fastify.loadUser]
    }, async (req) => {
        try {
            await db.run('UPDATE users SET avatar = NULL WHERE id = ?', [req.params.id]);
            return { message: 'Avatar removed successfully' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw fastify.httpErrors.internalServerError('Failed to remove avatar: ' + err.message);
        }
    })
}