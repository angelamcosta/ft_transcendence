import { fetch, Agent as UndiciAgent } from 'undici';
import { db, fetchUserById } from './utils.mjs';

const tlsAgent = new UndiciAgent({
	connect: { rejectUnauthorized: false }
});

/*export async function validateEmptyBody(res, rep) {
    if (request.raw.method !== 'POST') return;

    const body = res.body;

    if (body === undefined || Object.keys(body).length === 0)
        return rep.code(400).send({ error: 'JSON body is empty' });
}*/

export function validateData(fastify) {
	return async (req) => {
		if (req.method === 'PUT') {
			const { oldPassword, newPassword, confirmPassword, display_name } = req.body;

			const changedName = display_name !== undefined;
			const changedPassword = (oldPassword !== undefined && newPassword !== undefined && confirmPassword !== undefined);

			if (!changedName && !changedPassword)
				throw fastify.httpErrors.badRequest('You must provide either display_name or all of oldPassword, newPassword and confirmPassword');

			if (newPassword !== undefined) {
				if (typeof newPassword !== 'string')
					throw fastify.httpErrors.badRequest('Invalid password');
				if (newPassword.length < 6)
					throw fastify.httpErrors.badRequest('Password must be at least 6 characters long');
			}

			if (display_name !== undefined) {
				if (typeof display_name !== 'string')
					throw fastify.httpErrors.badRequest('Display name must be a string');
				if (display_name.length > 20)
					throw fastify.httpErrors.badRequest('Display name too long');
			}
		}
	};
}

export function authenticateRequest(fastify) {
	return async (req) => {
		const token = req.cookies?.auth;
		if (!token)
			throw fastify.httpErrors.unauthorized('Unauthorized');

		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 5000);

			const response = await fetch('https://auth:4000/api/verify', {
				dispatcher: tlsAgent,
				method: 'GET',
				headers: { 'cookie': `auth=${token}` },
				signal: controller.signal
			});

			clearTimeout(timeout);

			if (!response.ok) {
				console.error(`Auth service responded with status: ${response.status}`);
				throw fastify.httpErrors.unauthorized('Invalid token');
			}

			const data = await response.json();
			req.authUser = data.user;
		} catch (err) {
			if (err.name === 'AbortError')
				throw fastify.httpErrors.serviceUnavailable('Auth request timed out');
			else
				console.error('Auth request failed:', err);
			throw fastify.httpErrors.unauthorized('Auth failed');
		}
	};
}

export function loadFriendship(fastify) {
	return async (req) => {
		const { userId, targetId } = req;

		const blocked = await db.get(`SELECT 1 FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`, [userId, targetId, targetId, userId]);

		if (blocked)
			throw fastify.httpErrors.badRequest('You cannot add this user');

		try {
			const friendship = await db.get(`SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`, [userId, targetId, targetId, userId]);

			req.friendship = friendship || null;

			if (friendship?.friendship_status === 'accepted') {
				const friendId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id;
				const friend = await fetchUserById(friendId);

				if (friend) {
					req.friend = {
						id: friend.id,
						display_name: friend.display_name,
						avatar: friend.avatar
					};
				}
			}

		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	};
}

export function loadMatchInvites(fastify) {
	return async (req) => {
		const { userId, targetId } = req;

		const blocked = await db.get(`SELECT 1 FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?) 
			OR (blocker_id = ?AND blocked_id = ?)`, [userId, targetId, targetId, userId]);

		if (blocked)
			throw fastify.httpErrors.badRequest(`Can't invite blocked users to a match`);

		try {
			const invite = await db.get(`SELECT * FROM match_invites WHERE (user_id = ? AND friend_id = ?) 
				OR (user_id = ? AND friend_id = ?)`, [userId, targetId, targetId, userId]);

			req.invite = invite || null;
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	};
}

export function validateUsers(fastify) {
	return async (req) => {
		const target_id = Number(req.params.id);

		if (req.authUser.id === target_id)
			throw fastify.httpErrors.badRequest('Cannot perform this operation on yourself');

		try {
			const [user, target] = await Promise.all([
				fetchUserById(req.authUser.id, fastify),
				fetchUserById(target_id, fastify)
			]);

			if (!user || !target)
				throw fastify.httpErrors.notFound('One or both users not found');
			req.userId = req.authUser.id;
			req.targetId = target.id;
		} catch (err) {
			if (err.statusCode && err.statusCode !== 500)
				throw err;
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	}
}

export function notBlocked(fastify) {
	return async (req) => {
		const { userId, targetId } = req;

		const isBlocked = await db.get(
			'SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
			[userId, targetId]
		);
		if (isBlocked)
			throw fastify.httpErrors.conflict('User is already blocked');
	}
}

export function isBlocked(fastify) {
	return async (req) => {
		const { userId, targetId } = req;

		const isBlocked = await db.get(
			'SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
			[userId, targetId]
		);
		if (!isBlocked)
			throw fastify.httpErrors.conflict('User is not blocked');
	}
}
