import Fastify from 'fastify';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createHash, randomBytes } from 'crypto';

const db = await open({
	filename: process.env.DB_PATH,
	driver: sqlite3.Database
});

const app = Fastify({ logger: true })
const PORT = 4000

// app.get('/health', async (req, reply) => {
// 	return { 
// 		status: 'OK', 
// 		timestamp: new Date().toISOString(),
// 		db: await checkDbHealth()  // Optional: Verify DB connection
// 	  };
// });

// async function checkDbHealth() {
// 	try {
// 		await db.get('SELECT 1');  // Simple query to test DB
// 		return 'connected';
// 	  } catch (err) {
// 		return 'disconnected';
// 	  }
// }

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
	err ? (console.error(err), process.exit(1)) : console.log(`Server running on ${PORT}`)
})

function hasPassword(password, salt = randomBytes(32).toString('hex')) {
	const hash = createHash('sha256')
		.update(password + salt)
		.digest('hex')
	return `${salt}:${hash}`
}


app.post('/register', async (req, reply) => {
	const {username, email, password } = req.body;

	if (!username || email || password) {
		reply.status(400).send({error: 'Missing fields!'});
	}

	const userExists = await db.get('SELECT id FROM users where username = ?', [username]);

	if (userExists) {
		reply.status(400).send({error: 'Username is already registered.'});
	}

	const emailExists = await db.get('SELECT id FROM users where email = ?', [email]);

	if (emailExists) {
		reply.status(400).send({error: 'Email is already registered.'});
	}

	const hashed = hasPassword(password)

	await db.run('INSERT INTO users VALUES (username, email, password) VALUES (?, ?, ?', [username, email, hashed])
});