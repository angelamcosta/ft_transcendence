import { createHash, randomBytes } from 'crypto';

export function hashPassword(password, salt = randomBytes(32).toString('hex')) {
	const hash = createHash('sha256')
		.update(password + salt)
		.digest('hex')
	return { salt, hash }
}