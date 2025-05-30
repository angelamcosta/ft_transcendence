import { db } from './utils.mjs'
import { promises as fsp } from 'fs';
import path from 'path';
import crypto from 'crypto';

export default async function userRoutes(fastify) {
	// ! users
	fastify.get('/users/', {
		preValidation: fastify.authenticateRequest,
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
		preValidation: fastify.authenticateRequest,
	}, async (req) => {
		try {
			const user = await db.get('SELECT display_name, avatar, id FROM users WHERE id = ?', [req.params.id]);
			if (!user)
				throw fastify.httpErrors.notFound('User not found');
			return (user);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Failed to fetch user: ' + err.message);
		}
	});

	fastify.put('/users/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateData],
	}, async (req) => {
		const paramId = Number(req.params.id);

		if (req.authUser.id !== paramId)
			throw fastify.httpErrors.forbidden('You cannot modify another user');

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

		params.push(req.authUser.id);

		try {
			await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
			return { message: 'User updated successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.delete('/users/:id', {
		preValidation: fastify.authenticateRequest,
	}, async (req) => {
		try {
			const paramId = Number(req.params.id);

			if (req.authUser.id !== paramId)
				throw fastify.httpErrors.forbidden('You cannot modify another user');

			await db.run('DELETE FROM users WHERE id = ?', [req.authUser.id]);
			return { message: 'User deleted successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	// ! block / unblock
	fastify.post('/users/block/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.notBlocked, fastify.loadFriendship],
	}, async (req) => {
		try {
			if (req.friendship)
				await db.run(`DELETE FROM friends WHERE user_id = ? AND friend_id = ?`, [req.orderedIds.user_id, req.orderedIds.friend_id]);
			await db.run(`INSERT INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)`, [req.authUser.id, req.targetId]);
			return { message: 'User blocked successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.post('/users/unblock/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.isBlocked],
	}, async (req) => {
		try {
			await db.run(`DELETE FROM blocked_users WHERE blocker_id = ? and blocked_id = ?`, [req.authUser.id, req.targetId]);
			return { message: 'User unblocked successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	// ! avatar
	fastify.get('/users/:id/avatar', {
		preValidation: fastify.authenticateRequest,
	}, async (req, reply) => {
		try {
			const row = await db.get('SELECT avatar FROM users WHERE id = ?', [req.params?.id]);

			if (!row || !row.avatar)
				throw fastify.httpErrors.notFound('Avatar not found');

			const avatarPath = path.join(process.env.UPLOAD_DIR, row.avatar);
			const buffer = await fsp.readFile(avatarPath);
			const ext = path.extname(row.avatar).toLowerCase();
			let contentType;

			if (ext === '.png') contentType = 'image/png';
			else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
			else contentType = 'application/octet-stream';

			reply.header('Content-Type', contentType);
			return reply.send(buffer);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Failed to fetch avatar: ' + err.message);
		}
	});

	fastify.put('/users/:id/avatar', {
		preValidation: fastify.authenticateRequest,
	}, async (req, res) => {
		const data = await req.file();

		if (!data)
			throw fastify.httpErrors.badRequest('No file uploaded');

		const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
		if (!allowedMimeTypes.includes(data.mimetype))
			throw fastify.httpErrors.unsupportedMediaType('Only JPEG, JPG and PNG images are allowed');

		try {
			const fileExt = path.extname(data.filename);
			const uniqueName = crypto.randomUUID() + fileExt;
			const uploadPath = path.join(process.env.UPLOAD_DIR, uniqueName);

			await fsp.mkdir(path.dirname(uploadPath), { recursive: true });
			await fsp.writeFile(uploadPath, await data.toBuffer());
			await db.run('UPDATE users SET avatar = ? WHERE id = ?', [uniqueName, req.authUser.id]);

			return { message: 'Avatar uploaded successfully', avatar: uniqueName };
		} catch (err) {
			if (err.code == 'FST_REQ_FILE_TOO_LARGE')
				res.status(413).send({ error: 'Image exceeds 2MB limit.' });
			else {
				fastify.log.error(`Database error: ${err.message}`);
				throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
			}
		}
	});

	fastify.delete('/users/:id/avatar', {
		preValidation: [fastify.authenticateRequest]
	}, async (req) => {
		const paramId = Number(req.params.id);

		if (req.authUser.id !== paramId)
			throw fastify.httpErrors.forbidden('You cannot modify another user');

		const userId = req.authUser.id;

		const row = await db.get('SELECT avatar FROM users WHERE id = ?', [userId]);
		if (!row || row.avatar === 'default.png')
			return { message: 'You currently have no avatar uploaded' };

		const uploadDir = process.env.UPLOAD_DIR;
		if (!uploadDir) {
			fastify.log.error('UPLOAD_DIR env var is not set');
			throw fastify.httpErrors.internalServerError('Server misconfiguration');
		}

		const filePath = path.join(uploadDir, row.avatar);

		try {
			try {
				await fsp.unlink(filePath);
			} catch (err) {
				if (err.code !== 'ENOENT') {
					fastify.log.error(`Failed to delete avatar file: ${err.message}`);
					throw fastify.httpErrors.internalServerError('Failed to delete avatar file');
				}
			}

			await db.run('UPDATE users SET avatar = ? WHERE id = ?', ['default.png', userId]);

			return { message: 'Avatar deleted successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database delete failed: ' + err.message);
		}
	});

	// ! friends
	fastify.get('/users/friends', {
		preValidation: fastify.authenticateRequest,
	}, async (req, res) => {
		try {
			const friends = await db.all(`SELECT u.id, u.display_name, u.avatar  FROM friends AS f JOIN users AS u ON (f.user_id   = ? AND u.id = f.friend_id) OR (f.friend_id = ? AND u.id = f.user_id) WHERE f.friendship_status = 'accepted'`, [req.authUser.id, req.authUser.id]);

			return res.send(friends);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Failed to fetch user: ' + err.message);
		}
	});

	fastify.get('/users/friends/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship],
	}, async (req) => {
		if (req.friendship?.friendship_status === "accepted")
			return { friend: req.friend };
		else
			throw fastify.httpErrors.notFound('Friend not found');
	});

	fastify.post('/users/friends/add/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship],
	}, async (req) => {
		const { user_id, friend_id } = req.orderedIds;

		if (req.friendship?.friendship_status === "accepted")
			throw fastify.httpErrors.conflict('Friendship is already accepted');

		if (req.friendship?.friendship_status === "pending")
			throw fastify.httpErrors.conflict('Friendship is pending');

		try {
			await db.run(`INSERT INTO friends (user_id, friend_id, friendship_status) VALUES (?, ?, ?)`, [user_id, friend_id, 'pending']);
			return { message: 'Friend request sent' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.put('/users/friends/accept/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship],
	}, async (req) => {
		if (!req.friendship)
			throw fastify.httpErrors.notFound('Friend request not found');

		if (req.friendship?.friendship_status !== 'pending')
			throw fastify.httpErrors.badRequest('Friendship is not pending');

		try {
			await db.run(`UPDATE friends SET friendship_status = 'accepted' WHERE user_id = ? and friend_id = ?`, [req.orderedIds.user_id, req.orderedIds.friend_id]);
			return { message: 'Friend request accepted' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.put('/users/friends/reject/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship],
	}, async (req) => {
		if (!req.friendship)
			throw fastify.httpErrors.notFound('Friend request not found');

		if (req.friendship?.friendship_status !== 'pending')
			throw fastify.httpErrors.badRequest('Friendship is not pending');

		try {
			await db.run(`UPDATE friends SET friendship_status = 'rejected' WHERE user_id = ? and friend_id = ?`, [req.orderedIds.user_id, req.orderedIds.friend_id]);
			return { message: 'Friend request rejected' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.delete('/users/friends/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship],
	}, async (req) => {
		if (!req.friendship)
			throw fastify.httpErrors.notFound('Friendship does not exist');
	
		if ((req.friendship?.friendship_status !== 'accepted') || (req.friendship?.friendship_status === 'pending'))
			throw fastify.httpErrors.badRequest('Friendship does not exist');

		try {
			await db.run(`DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`, [req.orderedIds.user_id, req.orderedIds.friend_id]);
			return { message: 'Friend removed' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.get('/users/friends/requests', {
		preValidation: fastify.authenticateRequest,
	}, async (req, res) => {
		try {
			const requests = await db.all(`SELECT * FROM friends WHERE (user_id = ? OR friend_id = ?) AND friendship_status = 'pending'`, [req.authUser.id, req.authUser.id]);
			return res.send(requests);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});
}
