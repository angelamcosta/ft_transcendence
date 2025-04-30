import { db } from './utils.mjs'
import { promises as fsp } from 'fs';

export default async function userRoutes(fastify) {
    // ! /users
    fastify.get('/users/', {
        preValidation: [fastify.authenticateRequest, fastify.validateMethod],
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
        preValidation: [fastify.authenticateRequest, fastify.validateMethod],
        preHandler: [fastify.loadUser],
    }, async (req, res) => {
        return res.send(req.user);
    });

    fastify.put('/users/:id', {
        preValidation: [fastify.authenticateRequest, fastify.validateData, fastify.validateMethod],
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
        preValidation: [fastify.authenticateRequest, fastify.validateMethod],
        preHandler: [fastify.loadUser]
    }, async (req, res) => {
        try {
            await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
            return { message: 'User deleted successfully' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    })

    // ! avatar
    fastify.get('/users/:id/avatar', {
        preValidation: [fastify.authenticateRequest, fastify.validateMethod],
        preHandler: [fastify.loadAvatar],
    }, async (req, res) => {
        return res.send(req.avatar);
    });

    fastify.put('/users/:id/avatar', {
        preValidation: [fastify.authenticateRequest, fastify.validateMethod],
        preHandler: [fastify.loadUser],
    }, async (req) => {
        const data = await req.file();

        if (!data)
            throw fastify.httpErrors.badRequest('No file uploaded');

        const allowedMimeTypes = ['image/jpeg', 'image/png'];
        if (!allowedMimeTypes.includes(data.mimetype))
            throw fastify.httpErrors.unsupportedMediaType('Only JPEG and PNG images are allowed');

        try {
            const fileExt = path.extname(data.filename);
            const uniqueName = crypto.randomUUID() + fileExt;
            const uploadPath = path.join('/app/uploads/avatars', uniqueName);

            await fsp.mkdir(path.dirname(uploadPath), { recursive: true });
            await fsp.writeFile(uploadPath, await data.toBuffer());
            await db.run('UPDATE users SET avatar = ? WHERE id = ?', [uniqueName, req.user.id]);

            return { message: 'Avatar uploaded successfully', avatar: uniqueName };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.delete('/users/:id/avatar', {
        preValidation: [fastify.authenticateRequest, fastify.validateMethod],
        preHandler: [fastify.loadUser]
    }, async (req, res) => {
        try {
            await db.run('UPDATE users SET avatar = NULL WHERE id = ?', [req.params.id]);
            return { message: 'Avatar deleted successfully' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            return res.code(204).send();
        }
    });

    // ! friends
    fastify.get('/users/:id/friends', {
        preValidation: [fastify.authenticateRequest, fastify.validateMethod, fastify.loadUser]
    }, async (req, res) => {
        try {
            const userId = req.params.id
            const friends = await db.all(`SELECT * FROM friends WHERE (user_id = ? OR friend_id = ?) AND friendship_status = 'accepted'`, [userId, userId]);
            return res.send(friends);
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.post('/users/:id/friends/:friend_id', {
        preValidation: [fastify.authenticateRequest, fastify.validateMethod, fastify.loadFriendship]
    }, async (req) => {
        const { user_id, friend_id } = req.orderedIds;

        if (req.friendship)
            throw fastify.httpErrors.conflict('Friendship already exists or pending');

        try {
            await db.run(`INSERT INTO friends (user_id, friend_id, friendship_status) VALUES (?, ?, ?)`, [user_id, friend_id, 'pending']);
            return { message: 'Friend request sent' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.put('/users/:id/friends/:friend_id/accept', {
        preValidation: [fastify.authenticateRequest, fastify.validateMethod, fastify.loadFriendship]
    }, async (req) => {
        if (!req.friendship)
            throw fastify.httpErrors.notFound('Friend request not found');

        if (req.friendship.friendship_status !== 'pending')
            throw fastify.httpErrors.badRequest('Friendship is not pending');
        try {
            await db.run(`UPDATE friends SET friendship_status = 'accepted' WHERE user_id = ? and friend_id = ?`, [req.orderedIds.user_id, req.orderedIds.friend_id]);
            return { message: 'Friend request accepted' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.put('/users/:id/friends/:friend_id/reject', {
        preValidation: [fastify.authenticateRequest, fastify.validateMethod, fastify.loadFriendship]
    }, async (req) => {
        if (!req.friendship)
            throw fastify.httpErrors.notFound('Friend request not found');

        if (req.friendship.friendship_status !== 'pending')
            throw fastify.httpErrors.badRequest('Friendship is not pending');
        try {
            await db.run(`UPDATE friends SET friendship_status = 'rejected' WHERE user_id = ? and friend_id = ?`, [req.orderedIds.user_id, req.orderedIds.friend_id]);
            return { message: 'Friend request rejected' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.delete('/users/:id/friends/:friend_id', {
        preValidation: [fastify.authenticateRequest, fastify.validateMethod, fastify.loadFriendship]
    }, async (req) => {
        if (!req.friendship)
            throw fastify.httpErrors.notFound('Friend request not found');

        try {
            await db.run(`DELETE FROM friends WHERE user_id = ? and friend_id = ?`, [req.orderedIds.user_id, req.orderedIds.friend_id]);
            return { message: 'Friend removed' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });
}
