import { fetchUserById, idRegex, emailRegex } from './utils.mjs'

export function loadUser(fastify) {
    return async (req) => {
        if (!idRegex.test(req.params.id))
            throw fastify.httpErrors.badRequest('Invalid ID format');

        const id = req.params.id;
        const user = await fetchUserById(id);

        if (!user) throw fastify.httpErrors.notFound('User not found');
        req.user = user;
    }
}

export function loadAvatar(fastify) {
    return async (req) => {
        if (!idRegex.test(req.params.id))
            throw fastify.httpErrors.badRequest('Invalid ID format');

        const id = req.params.id;
        const user = await fetchUserById(id);

        if (!user) throw fastify.httpErrors.notFound('User not found');
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
            if (display_name !== undefined && display_name.length > 20)
                throw fastify.httpErrors.badRequest('Display name too long');
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
            const response = await fetch('http://auth:4000/verify', {
                method: 'GET',
                headers: {
                    'cookie': `auth=${token}`
                }
            });
            
            if (!response.ok) {
                console.error(`Response failed with status: ${response.status}`);
                throw fastify.httpErrors.unauthorized('Invalid token');
            }

            const data = await response.json();
            req.user = data.user;
        } catch (err) {
            throw fastify.httpErrors.unauthorized('Auth failed');
        }
    }
}
