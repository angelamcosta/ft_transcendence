import { db } from './utils.mjs'
import { promises as fsp } from 'fs';
import fs from 'fs';
import path from 'path';
import argon2 from 'argon2';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';

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

		const { password, display_name } = req.body;
		const updates = [];
		const params = [];

		if (password !== undefined) { 
			const hashedPassword = await argon2.hash(password);
			updates.push('password = ?');
			params.push(hashedPassword);
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

	fastify.get('/users/block/relationship/:id', { 
		preValidation: [fastify.authenticateRequest, fastify.validateUsers] 
	}, async (req, reply) => {
		try {
			const userId = req.authUser.id;
			const paramId = req.params.id;

			const row = await db.get(
				`SELECT EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?) AS blocked_by_me,
				EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?) AS blocked_by_target`,
				[userId, paramId, paramId, userId]);
			
			return reply.send({
				blockedByMe: Boolean(row.blocked_by_me),
				blockedByTarget: Boolean(row.blocked_by_target)
			})
		} catch (e) {
			console.error('Proxy /users/block/status/:id error:', e);
			return reply.code(500).send({ error: 'Error fetching blocked status' });
		}
	})

	fastify.get('/users/block/status/:id',  {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers]
	}, async (req) => {
		try {
			const userId = req.authUser.id;
			const paramId = Number(req.params.id);
	
			const row = await db.get('SELECT status FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?)', [userId, paramId]);

			const blocked = row ? Boolean(row.status) : false;
			return ({ blocked} );
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database fetch failed: ' + err.message);
		}
	})

	fastify.post('/users/block/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.notBlocked, fastify.loadFriendship],
	}, async (req) => {
		try {
			const userId = req.authUser.id;
			const paramId = Number(req.params.id);

			if (userId === paramId)
				throw fastify.httpErrors.forbidden('You cannot perform this operation on yourself');

			if (req.friendship)
				await db.run(`DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`, [userId, paramId, paramId, userId]);
			await db.run(`INSERT INTO blocked_users (blocker_id, blocked_id, status) VALUES (?, ?, ?)`, [userId, paramId, true]);
			return { message: 'User blocked successfully' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.delete('/users/unblock/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.isBlocked],
	}, async (req) => {
		try {
			const userId = req.authUser.id;
			const paramId = Number(req.params.id);

			if (userId === paramId)
				throw fastify.httpErrors.forbidden('You cannot perform this operation on yourself');

			await db.run(`DELETE FROM blocked_users WHERE blocker_id = ? and blocked_id = ?`, [userId, paramId]);
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
			reply.header('Cache-Control', 'no-cache');
			return reply.send(buffer);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Failed to fetch avatar: ' + err.message);
		}
	});


	fastify.put('/users/:id/avatar', {
		preValidation: fastify.authenticateRequest,
	}, async (req, reply) => {
		const paramId = Number(req.params.id);

		if (req.authUser.id !== paramId)
			throw fastify.httpErrors.forbidden('You cannot modify another user');

		const data = await req.file();

		if (!data)
			throw fastify.httpErrors.badRequest('No file uploaded');

		const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
		if (!allowedMimeTypes.includes(data.mimetype))
			throw fastify.httpErrors.unsupportedMediaType('Only JPEG, JPG and PNG images are allowed');

		const fileExt = path.extname(data.filename);
		const uniqueName = crypto.randomUUID() + fileExt;
		const uploadPath = path.join(process.env.UPLOAD_DIR, uniqueName);
		try {
			await fsp.mkdir(path.dirname(uploadPath), { recursive: true });
			await pipeline(data.file, fs.createWriteStream(uploadPath));
			if (data.file.truncated) {
				await fsp.unlink(uploadPath);
				return reply.status(413).send({ error: 'Image exceeds 2MB limit.' });
    		}
			const row = await db.get('SELECT avatar FROM users WHERE id = ?', [paramId]);
			if (row && row.avatar && row.avatar !== 'default.png') {
				const oldPath = path.join(process.env.UPLOAD_DIR, row.avatar);
			try {
				await fsp.unlink(oldPath);
			} catch (err) {
				if (err.code !== 'ENOENT')
					throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
			}
		}
			await db.run('UPDATE users SET avatar = ? WHERE id = ?', [uniqueName, req.authUser.id]);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
		return { message: 'Avatar uploaded successfully', avatar: uniqueName };
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
		const { userId, targetId } = req;

		const blocked = await db.get(`SELECT 1 FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`, [userId, targetId, targetId, userId]);

		if (blocked)
			throw fastify.httpErrors.forbidden('You cannot add this user');

		if (req.friendship?.friendship_status === "accepted")
			throw fastify.httpErrors.conflict('Friendship is already accepted');

		if (req.friendship?.friendship_status === "pending")
			throw fastify.httpErrors.conflict('Friendship is pending');

		try {
			await db.run(`INSERT INTO friends (user_id, friend_id, friendship_status) VALUES (?, ?, ?)`, [userId, targetId, 'pending']);
			return { message: 'Friend request sent' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.put('/users/friends/accept/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship],
	}, async (req) => {
		const userId = req.authUser.id;
		const paramId = Number(req.params.id);

		if (!req.friendship)
			throw fastify.httpErrors.notFound('Friend request not found');

		if (req.friendship?.friendship_status !== 'pending')
			throw fastify.httpErrors.badRequest('Friendship is not pending');

		if (req.friendship.user_id != paramId || req.friendship.friend_id != userId)
			throw fastify.httpErrors.forbidden('You cannot accept your own request');

		try {
			await db.run(`UPDATE friends SET friendship_status = 'accepted' WHERE user_id = ? 
				AND friend_id = ? AND friendship_status = 'pending'`, [paramId, userId]);
			return { message: 'Friend request accepted' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.put('/users/friends/reject/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship],
	}, async (req) => {
		const userId = req.authUser.id;
		const paramId = Number(req.params.id);

		if (!req.friendship)
			throw fastify.httpErrors.notFound('Friend request not found');

		if (req.friendship?.friendship_status !== 'pending')
			throw fastify.httpErrors.badRequest('Friendship is not pending');

		if (req.friendship.user_id != paramId || req.friendship.friend_id != userId)
			throw fastify.httpErrors.forbidden('You cannot reject your own request');

		try {
			await db.run(`DELETE FROM friends WHERE friendship_status = 'pending' AND (user_id = ? 
				AND friend_id = ?)`, [paramId, userId]);
			return { message: 'Friend request rejected' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.delete('/users/friends/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship],
	}, async (req) => {
		const userId = req.authUser.id;
		const paramId = Number(req.params.id);

		if (!req.friendship)
			throw fastify.httpErrors.notFound('Friend request not found');

		if (req.friendship?.friendship_status !== 'accepted')
			throw fastify.httpErrors.badRequest('Friendship does not exist');

		try {
			await db.run(`DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`, [userId, paramId, paramId, userId]);
			return { message: 'Friend removed' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.get('/users/invite/received', { 
		preValidation: fastify.authenticateRequest 
	}, async (req, res) => {
		try {
			const received = await db.all(`SELECT user_id, friend_id, invite_status FROM match_invites WHERE friend_id = ? AND invite_status = 'pending'`, req.authUser.id);
			return res.send(received);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	})

	fastify.get('/users/invite/sent', { 
		preValidation: fastify.authenticateRequest 
	}, async (req, res) => {
		try {
			const sent = await db.all(`SELECT user_id, friend_id, invite_status FROM match_invites WHERE user_id = ? AND invite_status = 'pending'`, req.authUser.id);
			return res.send(sent);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	})

	fastify.put('/users/invite/cancel/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers]
	}, async (req, res) => {
		const userId = req.authUser.id;
		const paramId = Number(req.params.id);

		const pending = await db.get('SELECT user_id FROM match_invites WHERE user_id = ? AND friend_id = ?', [userId, paramId]);

		if (!pending)
			throw fastify.httpErrors.badRequest('There is no pending invite');

		try {
			await db.run('DELETE FROM match_invites WHERE user_id = ? AND friend_id = ?', [userId, paramId]);
			return({ message: 'Invite canceled' })
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	})

	fastify.post('/users/invite/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadMatchInvites],
	}, async (req, res) => {
		const userId = req.authUser.id;
		const paramId = Number(req.params.id);

		if (req.invite?.invite_status === 'pending')
			throw fastify.httpErrors.badRequest('There is already a pending match invite');

		try {
			await db.run(`INSERT INTO match_invites (user_id, friend_id) VALUES (?, ?)`, [userId, paramId]);
			return { message: 'Match invite sent' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	})

	fastify.put('/users/invite/accept/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadMatchInvites],
	}, async (req, res) => {
		const userId = req.authUser.id;
		const paramId = Number(req.params.id);

		if (!req.invite)
			throw fastify.httpErrors.badRequest('Match invite not found');

		if (req.invite?.invite_status !== 'pending')
			throw fastify.httpErrors.badRequest('No match invite pending from this user');

		if (req.invite.user_id != paramId || req.invite.friend_id != userId)
			throw fastify.httpErrors.forbidden('You cannot accept your own invite');

		try {
			await db.run('INSERT INTO matches (player1_id, player2_id) VALUES (?, ?)', [userId, paramId]);
			await db.run('DELETE FROM match_invites WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)', [userId, paramId, paramId, userId]);
			return { message: 'Match invite accepted' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	})

	fastify.put('/users/invite/reject/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadMatchInvites],
	}, async (req, res) => {
		const userId = req.authUser.id;
		const paramId = Number(req.params.id);

		if (!req.invite)
			throw fastify.httpErrors.badRequest('Match invite not found');

		if (req.invite?.invite_status !== 'pending')
			throw fastify.httpErrors.badRequest('No match invite pending from this user');

		if (req.invite.user_id != paramId || req.invite.friend_id != userId)
			throw fastify.httpErrors.forbidden('You cannot reject your own invite');

		try {
			await db.run('DELETE FROM match_invites WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?', [userId, paramId, paramId, userId]);
			return { message: 'Match invite rejected' };
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	})

	fastify.get('/users/friends/requests', {
		preValidation: fastify.authenticateRequest,
	}, async (req, res) => {
		try {
			const requests = await db.all(`SELECT user_id, friend_id, friendship_status FROM friends WHERE (user_id = ? OR friend_id = ?) AND friendship_status = 'pending'`, [req.authUser.id, req.authUser.id]);
			return res.send(requests);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	// ! match history
	fastify.get('/users/:id/history', {
		preValidation: fastify.authenticateRequest,
	}, async (req, res) => {
		try {
			const match_history = await db.all(`SELECT player1_id, player2_id, winner_id, score FROM matches WHERE (player1_id = ? OR player2_id = ?) AND status = 'finished'`, [req.authUser.id, req.authUser.id]);
			return res.send(match_history);
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.get('/users/dm/unread', {
		preValidation: fastify.authenticateRequest,
	}, async (req, res) => {
		try {
			const userId = req.authUser.id;
			const rows = await db.all(
				`SELECT DISTINCT m.sender_id, u.display_name FROM dm_messages AS m
				LEFT JOIN dm_reads AS r ON m.room_key = r.room_key AND
				r.user_id  = ? JOIN users AS u ON u.id = m.sender_id
				WHERE m.timestamp > COALESCE(r.last_read, 0) AND m.sender_id != ?`, [userId, userId]
			);

			const unread = rows.map(r => r.display_name);
			return res.send({ unread });
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database feth failed: ' + err.message);
		}
	});
}
