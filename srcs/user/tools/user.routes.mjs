import { db } from './utils.mjs'
import { promises as fsp } from 'fs';
import path from 'path';
import crypto from 'crypto';

export default async function userRoutes(fastify) {
    const { httpErrors } = fastify;

    // ! users
    fastify.get('/users/', {
        preValidation: [fastify.authenticateRequest, fastify.validateMethod],
    }, async (req, res) => {
        try {
            const users = await db.all('SELECT id, display_name FROM users');
            return res.send(users);
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw httpErrors.internalServerError('Failed to fetch users: ' + err.message);
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
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
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
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.post('/users/:id/block/:target_id', {
        preValidation: [fastify.authenticateRequest, fastify.validateMethod],
        preHandler: [fastify.loadUser]
    }, async (req) => {
        // TODO : - block user
    });

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
            throw httpErrors.badRequest('No file uploaded');

        const allowedMimeTypes = ['image/jpeg', 'image/png'];
        if (!allowedMimeTypes.includes(data.mimetype))
            throw httpErrors.unsupportedMediaType('Only JPEG and PNG images are allowed');

        try {
            const fileExt = path.extname(data.filename);
            const uniqueName = crypto.randomUUID() + fileExt;
            const uploadPath = path.join(process.env.UPLOAD_DIR, uniqueName);

            await fsp.mkdir(path.dirname(uploadPath), { recursive: true });
            await fsp.writeFile(uploadPath, await data.toBuffer());
            await db.run('UPDATE users SET avatar = ? WHERE id = ?', [uniqueName, req.user.id]);

            return { message: 'Avatar uploaded successfully', avatar: uniqueName };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
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
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    // ! friends
    fastify.get('/users/:id/friends', {
        preValidation: [fastify.authenticateRequest, fastify.loadUser],
        preHandler: [fastify.loadUser]
    }, async (req, res) => {
        try {
            const userId = req.params.id;
            const friends = await db.all(`SELECT * FROM friends WHERE (user_id = ? OR friend_id = ?) AND friendship_status = 'accepted'`, [userId, userId]);
            return res.send(friends);
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.post('/users/:id/friends/:friend_id', {
        preValidation: [fastify.authenticateRequest, fastify.loadFriendship],
        preHandler: [fastify.loadUser]
    }, async (req) => {
        if (req.friendship?.friendship_status === "accepted")
            return { friend: req.friend };
        else
            throw httpErrors.notFound('Friend not found');
    });

    fastify.post('/users/:id/friends/add/:friend_id', {
        preValidation: [fastify.authenticateRequest, fastify.loadFriendship],
        preHandler: [fastify.loadUser]
    }, async (req) => {
        const { user_id, friend_id } = req.orderedIds;

        if (req.friendship?.friendship_status === "accepted")
            throw httpErrors.conflict('Friendship is already accepted');

        if (req.friendship?.friendship_status === "pending")
            throw httpErrors.conflict('Friendship is pending');

        try {
            await db.run(`INSERT INTO friends (user_id, friend_id, friendship_status) VALUES (?, ?, ?)`, [user_id, friend_id, 'pending']);
            return { message: 'Friend request sent' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.put('/users/:id/friends/accept/:friend_id', {
        preValidation: [fastify.authenticateRequest, fastify.loadFriendship],
        preHandler: [fastify.loadUser]
    }, async (req) => {
        if (!req.friendship)
            throw httpErrors.notFound('Friend request not found');

        if (req.friendship?.friendship_status !== 'pending')
            throw httpErrors.badRequest('Friendship is not pending');

        try {
            await db.run(`UPDATE friends SET friendship_status = 'accepted' WHERE user_id = ? and friend_id = ?`, [req.orderedIds.user_id, req.orderedIds.friend_id]);
            return { message: 'Friend request accepted' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.put('/users/:id/friends/reject/:friend_id', {
        preValidation: [fastify.authenticateRequest, fastify.loadFriendship],
        preHandler: [fastify.loadUser]
    }, async (req) => {
        if (!req.friendship)
            throw httpErrors.notFound('Friend request not found');

        if (req.friendship?.friendship_status !== 'pending')
            throw httpErrors.badRequest('Friendship is not pending');

        try {
            await db.run(`UPDATE friends SET friendship_status = 'rejected' WHERE user_id = ? and friend_id = ?`, [req.orderedIds.user_id, req.orderedIds.friend_id]);
            return { message: 'Friend request rejected' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });

    fastify.delete('/users/:id/friends/delete/:friend_id', {
        preValidation: [fastify.authenticateRequest, fastify.loadFriendship],
        preHandler: [fastify.loadUser]
    }, async (req) => {
        if (!req.friendship)
            throw httpErrors.notFound('Friend request not found');

        try {
            await db.run(`DELETE FROM friends WHERE user_id = ? and friend_id = ?`, [req.orderedIds.user_id, req.orderedIds.friend_id]);
            return { message: 'Friend removed' };
        } catch (err) {
            fastify.log.error(`Database error: ${err.message}`);
            throw httpErrors.internalServerError('Database update failed: ' + err.message);
        }
    });
}
