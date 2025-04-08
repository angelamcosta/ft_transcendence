CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    display_name TEXT UNIQUE,
    avatar TEXT DEFAULT 'default.png'
);