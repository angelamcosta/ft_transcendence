import { db } from './utils.mjs'

export function validateMethod(fastify) {
    return async (req) => {
        if ((req.method === 'PUT' || req.method === 'POST') && !req.body)
            throw fastify.httpErrors.badRequest('Request body is required');
    };
}

export function loadUser(fastify) {
    return async (req) => {
        if (req.params.id) {
            const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
            if (!user) throw fastify.httpErrors.notFound('User not found');
            req.user = user;
        }
    }
}

export function validateUser(fastify) {
    return async (req) => {
        if (req.method === 'PUT') {
            const { email, display_name } = req.body;

            if (email === undefined && display_name === undefined)
                throw fastify.httpErrors.badRequest('No fields provided');

            if (email !== undefined && (!email.includes('@') || typeof email !== 'string'))
                throw fastify.httpErrors.badRequest('Invalid email');

            if (display_name !== undefined && display_name.length > 20)
                throw fastify.httpErrors.badRequest('Display name too long');
        }
    };
}
