CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
	twofa_status NOT NULL DEFAULT 'pending',
	otp INTEGER,
	expire INTEGER,
	attempts INTEGER DEFAULT 0,
	temp_blocked INTEGER,
    display_name TEXT UNIQUE NOT NULL,
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

CREATE TABLE IF NOT EXISTS match_invites (
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    invite_status TEXT NOT NULL DEFAULT 'pending',
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blocked_users (
    blocker_id INTEGER NOT NULL,
    blocked_id INTEGER NOT NULL,
    PRIMARY KEY (blocker_id, blocked_id),
    FOREIGN KEY (blocker_id) REFERENCES users(id),
    FOREIGN KEY (blocked_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    capacity INTEGER NOT NULL DEFAULT 0;
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
);

CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY(tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    winner_id INTEGER NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    score TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    round INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY(player1_id) REFERENCES players(id),
    FOREIGN KEY(player2_id) REFERENCES players(id)
);

CREATE TABLE matchmaking_queue (
    player_id INTEGER PRIMARY KEY,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES players(id)
);
