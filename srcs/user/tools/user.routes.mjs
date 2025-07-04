import { db, verifyPassword } from './utils.mjs'
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
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Failed to fetch users: ' + err.message);
		}
	});

	fastify.get('/users/:id', {
		preValidation: fastify.authenticateRequest,
	}, async (req) => {
		try {
			const user = await db.get('SELECT email, display_name, avatar, id FROM users WHERE id = ?', [req.params.id]);
			if (!user)
				throw fastify.httpErrors.notFound('User not found');
			return (user);
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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

		const updates = [];
		const params = [];
		const { oldPassword, newPassword, confirmPassword, display_name } = req.body;
		const row = await db.get('SELECT display_name, password FROM users WHERE id = ?', req.authUser.id);

		if (newPassword !== undefined) {
			if (/\s/.test(oldPassword) || /\s/.test(newPassword) || /\s/.test(confirmPassword))
				throw fastify.httpErrors.badRequest('Password cannot have whitespaces');
			if (newPassword !== confirmPassword)
				throw fastify.httpErrors.badRequest('Confirm password and new password dont match');
			if (oldPassword === newPassword)
				throw fastify.httpErrors.badRequest('New password must differ from current one');
			if (newPassword.length < 6)
				throw fastify.httpErrors.badRequest('Password must be at least 6 characters');
			const verify = await argon2.verify(row.password, oldPassword);
			if (!verify)
				throw fastify.httpErrors.unauthorized('Current password is incorrect');
			const hashedPassword = await argon2.hash(newPassword);
			updates.push('password = ?');
			params.push(hashedPassword);
		}

		if (display_name !== undefined) {
			if (/\s/.test(display_name))
				throw fastify.httpErrors.badRequest('Display name cannot have whitespaces');
			if (display_name === row.display_name)
				throw fastify.httpErrors.badRequest('Display name must differ from current one');
			const userDisplayName = await db.get('SELECT display_name FROM users WHERE display_name = ?', [display_name]);
			if (userDisplayName)
				throw fastify.httpErrors.conflict('Display name already in use!');
			updates.push('display_name = ?');
			params.push(display_name);
		}

		params.push(req.authUser.id);

		try {
			await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
			return { message: 'User updated successfully' };
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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

			const user = await db.run('DELETE FROM users WHERE id = ?', [req.authUser.id]);
			if (user.changes === 0)
				throw fastify.httpErrors.notFound('User not found')
			return { message: 'User deleted successfully' };
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	// ! block / unblock

	fastify.get('/users/block', {
		preValidation: fastify.authenticateRequest,
	}, async (req, res) => {
		try {
			const userId = req.authUser.id;

			const row = await db.all(`SELECT u.id, u.display_name FROM blocked_users b JOIN users u 
				ON u.id = b.blocked_id WHERE b.blocker_id = ?`, userId);

			return res.send(row);
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database fetch failed: ' + err.message);
		}
	})

	fastify.get('/users/block/relationship/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers]
	}, async (req, res) => {
		try {
			const userId = req.authUser.id;
			const paramId = Number(req.params.id);

			const row = await db.get(
				`SELECT EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?) AS blocked_by_me,
				EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?) AS blocked_by_target`,
				[userId, paramId, paramId, userId]);

			return res.send({
				blockedByMe: Boolean(row.blocked_by_me),
				blockedByTarget: Boolean(row.blocked_by_target)
			})
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database fetch failed: ' + err.message);
		}
	})

	fastify.get('/users/block/status/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers]
	}, async (req) => {
		try {
			const userId = req.authUser.id;
			const paramId = Number(req.params.id);

			const row = await db.get('SELECT status FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?)', [userId, paramId]);

			const blocked = row ? Boolean(row.status) : false;
			return ({ blocked });
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database fetch failed: ' + err.message);
		}
	})

	fastify.post('/users/block/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.notBlocked, fastify.loadFriendship, fastify.loadMatchInvites],
	}, async (req) => {
		try {
			const userId = req.authUser.id;
			const paramId = Number(req.params.id);

			if (req.invite?.invite_status === 'pending')
				await db.run(`DELETE FROM match_invites WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`, [userId, paramId, paramId, userId]);
			if (req.friendship)
				await db.run(`DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`, [userId, paramId, paramId, userId]);
			await db.run(`INSERT INTO blocked_users (blocker_id, blocked_id, status) VALUES (?, ?, ?)`, [userId, paramId, true]);
			return { message: 'User blocked successfully' };
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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
			if (err.code === 'ENOENT')
				throw fastify.httpErrors.notFound('Avatar not found');
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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

		const extMap = {
			'image/jpeg': '.jpg',
			'image/jpg': '.jpg',
			'image/png': '.png'
		}
		if (!(data.mimetype in extMap))
			throw fastify.httpErrors.unsupportedMediaType('Only JPEG, JPG and PNG images are allowed');

		const expectedExt = extMap[data.mimetype]
		const actualExt = path.extname(data.filename).toLowerCase()

		if (actualExt !== expectedExt)
			throw fastify.httpErrors.unsupportedMediaType(`File extension "${actualExt}" does not match expected "${expectedExt}"`)


		const fileExt = extMap[data.mimetype];
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
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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

		if (req.friendship?.friendship_status === "accepted")
			throw fastify.httpErrors.conflict('Friendship is already accepted');

		if (req.friendship?.friendship_status === "pending")
			throw fastify.httpErrors.conflict('Friendship is pending');

		try {
			await db.run(`INSERT INTO friends (user_id, friend_id, friendship_status) VALUES (?, ?, ?)`, [userId, targetId, 'pending']);
			return { message: 'Friend request sent' };
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.delete('/users/friends/cancel/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship]
	}, async (req, res) => {
		const userId = req.authUser.id;
		const paramId = Number(req.params.id);

		if (req.friendship?.friendship_status !== 'pending')
			throw fastify.httpErrors.badRequest('There is no pending invite');

		try {
			const res = await db.get(`SELECT user_id FROM friends WHERE (user_id = ? AND friend_id = ?) AND friendship_status = 'pending'`, [userId, paramId]);

			if (res) {
				await db.run(`DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) AND friendship_status = 'pending'`, [userId, paramId]);
				return ({ message: 'Friend request canceled' })
			} else
				return ({ message: 'No pending friend request' })
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	})

	fastify.delete('/users/friends/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadFriendship],
	}, async (req) => {
		const userId = req.authUser.id;
		const paramId = Number(req.params.id);

		if (!req.friendship)
			throw fastify.httpErrors.notFound('You are not friends with this user');

		if (req.friendship?.friendship_status !== 'accepted')
			throw fastify.httpErrors.badRequest('Friendship does not exist');

		try {
			await db.run(`DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`, [userId, paramId, paramId, userId]);
			return { message: 'Friend removed' };
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.get('/users/friends/requests/received', {
		preValidation: fastify.authenticateRequest,
	}, async (req, res) => {
		try {
			const received = await db.all(`SELECT f.user_id AS id, u.display_name AS display_name
				FROM friends f JOIN users u ON u.id = f.user_id WHERE f.friend_id = ?
				AND f.friendship_status = 'pending'`, req.authUser.id);
			return res.send(received);
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.get('/users/friends/requests/sent', {
		preValidation: fastify.authenticateRequest,
	}, async (req, res) => {
		try {
			const sent = await db.all(`SELECT f.friend_id AS id, u.display_name AS display_name
				FROM friends f JOIN users u ON u.id = f.friend_id WHERE f.user_id = ?
				AND f.friendship_status = 'pending'`, req.authUser.id);
			return res.send(sent);
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.get('/users/friends/status/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers],
	}, async (req, res) => {
		try {
			const userId = req.authUser.id;
			const friendId = Number(req.params.id);

			const friendRow = await db.get(`SELECT 1 FROM friends WHERE ((user_id = ? AND friend_id = ?)
				OR (user_id = ? AND friend_id = ?)) AND friendship_status = 'accepted'`, [userId, friendId, friendId, userId]);
			const areFriends = !!friendRow;

			const sentRow = await db.get(`SELECT 1 FROM friends WHERE user_id = ? 
				AND friend_id = ? AND friendship_status = 'pending'`, [userId, friendId]);
			const requestSent = !!sentRow;

			const recvRow = await db.get(`SELECT 1 FROM friends WHERE user_id = ? 
				AND friend_id = ? AND friendship_status = 'pending'`, [friendId, userId]);
			const requestReceived = !!recvRow;

			return res.send({ areFriends, requestSent, requestReceived });
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database fetch failed: ' + err.message);
		}
	})

	fastify.get('/users/invite/received', {
		preValidation: fastify.authenticateRequest
	}, async (req, res) => {
		try {
			const received = await db.all(`SELECT user_id, friend_id, invite_status FROM match_invites WHERE friend_id = ? AND invite_status = 'pending'`, req.authUser.id);
			return res.send(received);
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	})

	fastify.delete('/users/invite/cancel/:id', {
		preValidation: [fastify.authenticateRequest, fastify.validateUsers, fastify.loadMatchInvites]
	}, async (req, res) => {
		const userId = req.authUser.id;
		const paramId = Number(req.params.id);

		if (req.invite?.invite_status !== 'pending')
			throw fastify.httpErrors.badRequest('There is no pending invite');

		try {
			const res = await db.get(`SELECT user_id FROM match_invites WHERE (user_id = ? AND friend_id = ?) AND invite_status = 'pending'`, [userId, paramId]);

			if (res) {
				await db.run(`DELETE FROM match_invites WHERE (user_id = ? AND friend_id = ?) AND invite_status = 'pending'`, [userId, paramId]);
				return ({ message: 'Match invite canceled' });
			} else
				return ({ message: 'Match invite not found' })
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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
			if (err.statusCode && err.statusCode !== 500)
				throw err;
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
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	})

	// ! match history
	fastify.get('/users/:id/history', {
		preValidation: fastify.authenticateRequest,
	}, async (req, res) => {
		try {
			const userId = req.params.id;
			const match_history = await db.all(`SELECT m.created_at, m.id, m.score, m.winner_id, CASE WHEN m.player1_id = $uid THEN m.player2_id 
				ELSE m.player1_id END AS opp_id, u.display_name AS opp_name, CASE WHEN m.winner_id = $uid THEN 'Win' 
				ELSE 'Defeat' END AS result FROM matches m JOIN users u ON u.id = (CASE WHEN m.player1_id = $uid THEN
				m.player2_id ELSE m.player1_id END) WHERE (m.player1_id = $uid OR m.player2_id = $uid) 
				AND m.status = 'finished' ORDER BY m.created_at DESC`, { $uid: userId });
			return res.send(match_history);
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	});

	fastify.get('/users/dm/unread', {
		preValidation: fastify.authenticateRequest,
	}, async (req, res) => {
		try {
			const userId = req.authUser.id;

			const rows = await db.all(`SELECT DISTINCT m.sender_id, u.display_name FROM dm_messages AS m
				LEFT JOIN dm_reads   AS r ON m.room_key = r.room_key AND r.user_id = ? JOIN users AS u
				ON u.id = m.sender_id WHERE m.timestamp > COALESCE(r.last_read, 0) AND m.sender_id != ?
				AND m.room_key LIKE '%' || ? || '%'`, [userId, userId, userId]);

			const unread = rows.map(r => r.display_name);
			return res.send({ unread });
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database feth failed: ' + err.message);
		}
	});
}
