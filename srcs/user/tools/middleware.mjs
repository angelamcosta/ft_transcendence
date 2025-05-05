import { db, fetchUserById, idRegex, emailRegex } from './utils.mjs';

export function loadUser(fastify) {
	return async (req) => {
		const id = req.params.id;

		if (!idRegex.test(id))
			throw fastify.httpErrors.badRequest('Invalid ID format');

		const user = await fetchUserById(id);
		if (!user)
			throw fastify.httpErrors.notFound('User not found');

		req.user = user;
	}
}

export function loadAvatar(fastify) {
	return async (req) => {
		const id = req.params.id;
		if (!idRegex.test(id))
			throw fastify.httpErrors.badRequest('Invalid ID format');

		const user = await fetchUserById(id);
		if (!user)
			throw fastify.httpErrors.notFound('User not found');

		req.avatar = user.avatar;
	}
}

export function validateData(fastify) {
	return async (req) => {
		if (req.method === 'PUT') {
			const { email, display_name } = req.body;

			if (email === undefined && display_name === undefined)
				throw fastify.httpErrors.badRequest('At least one field (email or display_name) must be provided');

			if (email !== undefined) {
				if (typeof email !== 'string' || !emailRegex.test(email))
					throw fastify.httpErrors.badRequest('Invalid email');
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

export function validateMethod(fastify) {
	return async (req) => {
		if ((req.method === 'PUT' || req.method === 'POST') && Object.keys(req.body || {}).length === 0)
			throw fastify.httpErrors.badRequest('Request body is required');
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

			const response = await fetch('http://auth:4000/verify', {
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
			req.user = data.user;
		} catch (err) {
			if (err.name === 'AbortError')
				console.error('Auth request timed out');
			else
				console.error('Auth request failed:', err);
			throw fastify.httpErrors.unauthorized('Auth failed');
		}
	};
}

export function loadFriendship(fastify) {
	return async (req) => {
		const { id, friend_id } = req.params;

		const userId = parseInt(id, 10);
		const friendId = parseInt(friend_id, 10);

		if (!Number.isInteger(userId) || !Number.isInteger(friendId))
			throw fastify.httpErrors.badRequest('Invalid id format');
	
		if (userId === friendId)
			throw fastify.httpErrors.badRequest('Cannot perform this operation on yourself');

		const [idA, idB] = userId < friendId ? [userId, friendId]
			: [friendId, userId];
		req.orderedIds = { user_id: idA, friend_id: idB };

		try {
			const [user, friend] = await Promise.all([
				fetchUserById(userId),
				fetchUserById(friendId)
			]);

			if (!user || !friend)
				throw fastify.httpErrors.notFound('One or both users not found');

			const friendship = await db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [idA, idB]);

			req.friendship = friendship || null;

			if (friendship?.friendship_status === "accepted") {
				req.friend = {
					id: friend.id,
					display_name: friend.display_name,
					avatar: friend.avatar
				};
			}
		} catch (err) {
			fastify.log.error(`Database error: ${err.message}`);
			throw fastify.httpErrors.internalServerError('Database update failed: ' + err.message);
		}
	};
}
