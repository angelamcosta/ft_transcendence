import { db } from './utils.mjs'
import { promises as fsp } from 'fs';
import path from 'path';
import crypto from 'crypto';

export default async function userRoutes(fastify) {
	const { httpErrors } = fastify;

	// ! users
	fastify.get('/users/', {
		preValidation: [fastify.authenticateRequest, fastify.isAdmin],
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
		preValidation: [fastify.authenticateRequest, fastify.loadUser, fastify.isUser],
	}, async (req, res) => {
		if (req.user.id === req.params.id)
			return res.send(req.user);
		else {
			try {
				return await db.get('SELECT display_name, avatar, id FROM users WHERE id = ?', [req.user.id]);
			} catch (err) {
				fastify.log.error(`Database error: ${err.message}`);
				throw httpErrors.internalServerError('Database update failed: ' + err.message);
			}
		}
	});

	fastify.put('/users/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateData, fastify.loadUser, fastify.isUser],
	}, async (req) => {
		if (req.user.id !== req.params.id)
			throw httpErrors.forbidden('You cannot modify another user');

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

		params.push(req.user.id);

		try {
			await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
			return { message: 'User updated successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.delete('/users/:id', {
		preValidation: [fastify.authenticateRequest, fastify.loadUser, fastify.isUser],
	}, async (req) => {
		try {
			await db.run('DELETE FROM users WHERE id = ?', [req.user.id]);
			return { message: 'User deleted successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	// ! block / unblock
	fastify.post('/users/:id/block', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.notBlocked, fastify.loadFriendship, fastify.loadUser, fastify.isUser],
	}, async (req) => {
		try {
			if (req.friendship)
				await db.run(`DELETE FROM friends WHERE user_id = ? AND friend_id = ?`, [req.orderedIds.user_id, req.orderedIds.friend_id]);
			await db.run(`INSERT INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)`, [req.userId, req.targetId]);
			return { message: 'User blocked successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.post('/users/:id/unblock', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.isBlocked, fastify.loadUser, fastify.isUser],
	}, async (req) => {
		try {
			await db.run(`DELETE FROM blocked_users WHERE blocker_id = ? and blocked_id = ?`, [req.userId, req.targetId]);
			return { message: 'User unblocked successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	// ! avatar
	fastify.get('/users/:id/avatar', {
		preValidation: [fastify.authenticateRequest, fastify.loadUser, fastify.loadAvatar, fastify.isUser],
	}, async (req, res) => {
		return res.send(req.avatar);
	});

	fastify.put('/users/:id/avatar', {
		preValidation: [fastify.authenticateRequest, fastify.loadUser, fastify.isUser],
	}, async (req, res) => {
		const { httpErrors } = fastify;
		const data = await req.file();

		if (!data)
			throw httpErrors.badRequest('No file uploaded');

		const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
		if (!allowedMimeTypes.includes(data.mimetype))
			throw httpErrors.unsupportedMediaType('Only JPEG, JPG and PNG images are allowed');

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
		preValidation: [fastify.authenticateRequest, fastify.loadUser, fastify.loadAvatar, fastify.isUser],
	}, async (req) => {
		if (req.avatar === 'default.png')
			return { message: 'You currently have no avatar uploaded' };

		const path = path.join(process.env.UPLOAD_DIR, req.avatar);

		try {
			try {
				await fsp.unlink(path);
			} catch (err) {
				if (err.code !== 'ENOENT') {
					fastify.log.error(`Failed to delete avatar file: ${err.message}`);
					throw httpErrors.internalServerError('Failed to delete avatar file');
				}
			}
			await db.run('UPDATE users SET avatar = default.png WHERE id = ?', [req.user.id]);
			return { message: 'Avatar deleted successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	// ! friends
	fastify.get('/users/:id/friends', {
		preValidation: [fastify.authenticateRequest, fastify.loadUser, fastify.isUser],
	}, async (req, res) => {
		try {
			const friends = await db.all(`SELECT display_name, avatar, id FROM friends WHERE (user_id = ? OR friend_id = ?) AND friendship_status = 'accepted'`, [req.user.id, req.user.id]);
			return res.send(friends);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.get('/users/:id/friends/:friend_id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship, fastify.loadUser, fastify.isUser],
	}, async (req) => {
		if (req.friendship?.friendship_status === "accepted")
			return { friend: req.friend };
		else
			throw httpErrors.notFound('Friend not found');
	});

	fastify.post('/users/:id/friends/add', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship, fastify.loadUser, fastify.isUser],
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

	fastify.put('/users/:id/friends/accept', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship, fastify.loadUser, fastify.isUser],
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

	fastify.put('/users/:id/friends/reject', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship, fastify.loadUser, fastify.isUser],
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

	fastify.delete('/users/:id/friends', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship, fastify.loadUser, fastify.isUser],
	}, async (req) => {
		if (!req.friendship)
			throw httpErrors.notFound('Friend request not found');

		try {
			await db.run(`DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`, [req.orderedIds.user_id, req.orderedIds.friend_id]);
			return { message: 'Friend removed' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.get('/users/:id/friends/requests', {
		preValidation: [fastify.authenticateRequest, fastify.loadUser, fastify.isUser],
	}, async (req, res) => {
		try {
			const requests = await db.all(`SELECT * FROM friends WHERE (user_id = ? OR friend_id = ?) AND friendship_status = 'pending'`, [req.user.id, req.user.id]);
			return res.send(requests);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});
}
