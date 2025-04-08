CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
	salt TEXT NOT NULL,
    display_name TEXT UNIQUE,
    avatar TEXT DEFAULT 'default.png'
);