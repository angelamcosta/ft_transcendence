CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
	salt TEXT NOT NULL,
	twofa_verify NOT NULL DEFAULT 'pending',
	twofa_status NOT NULL DEFAULT 'pending',
	otp INTEGER,
	expire INTEGER,
    display_name TEXT UNIQUE,
    avatar TEXT DEFAULT 'default.png'
);

CREATE TABLE IF NOT EXISTS friends (
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    friendship_status TEXT NOT NULL DEFAULT 'pending',
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);
