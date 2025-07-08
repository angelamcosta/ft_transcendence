import { hashPassword, sleep } from './utils.mjs';
import { sendResetLink } from "./emailService.mjs"

export async function sendLink(db, {email, protocol, host}, fastify) {
    if (!email || !protocol || !host) {
        const error = new Error('Missing fields')
        error.statusCode = 400
        throw error
    }

    if (/\s/.test(email)) {
        const error = new Error('Email must not contain whitespaces')
        error.statusCode = 400
        throw error
    }

    if (email.length > 128) {
        const error = new Error(`Email can't contain more than 128 characters`)
        error.statusCode = 400
        throw error
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        const error = new Error('Invalid email format')
        error.statusCode = 400
        throw error
    }

    email = email.toLowerCase();
    const user = await db.get('SELECT id FROM users where email = ?', [email]);
    if (!user) {
        return { message: 'If an account with that email exists, we’ve sent a reset link.' };
    }
    
    const expire = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const token = await fastify.jwt.sign(
        { userId: user.id, email: email, expireDate: expire },
        { expiresIn: '30m' }
    );
    
    try {
		await db.run(`INSERT INTO reset_password (user_id, token, expire) VALUES (?, ?, ?)`, [user.id, token, expire])
	} catch (dbError) {
		console.log('Database error details:', dbError)
		const error = new Error('Something went wrong. Please try again later.')
		error.statusCode = 500
		error.originalError = dbError
		throw error
	}

    const resetLink = `${protocol}://${host}/reset-password?token=${encodeURIComponent(token)}`;
    // Delays the email send for security reasons
    sleep(500);
    const linkSent = await sendResetLink(email, resetLink)
    if (!linkSent) {
        try {
            await db.run('DELETE FROM reset_password WHERE token = ?', [token]);
	    } catch (dbError) {
		    console.log('Database error details:', dbError)
		    const error = new Error('Something went wrong. Please try again later.')
		    error.statusCode = 500
		    error.originalError = dbError
		    throw error
	    }
        const error = new Error('Something went wrong. Please try again later.')
		error.statusCode = 500
		throw error
    }
    return { message: 'If an account with that email exists, we’ve sent a reset link.' };
}