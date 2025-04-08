import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const db = await open({
    filename: process.env.DB_PATH,
    driver: sqlite3.Database
});

export default async function userRoutes(fastify, option) {
    fastify.post('/users/{:id}/display-name', async (req, reply) => {
        const { id } = req.params;
        const { displayName } = req.body;

        const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
        if (!user)
            return reply.code(404).send({ error: 'User not found' });

        await db.run('UPDATE users SET display_name = ? WHERE id = ?', [displayName, id]);
        return { message: 'Display name updated successfully' };
    });

    fastify.get('/users/:id', async (req, reply) => {
        const { id } = req.params;

        const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
        if (!user)
            return reply.code(404).send({ error: 'User not found' });

        return user;
    });
}