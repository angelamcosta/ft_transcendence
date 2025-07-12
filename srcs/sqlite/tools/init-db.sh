#!/bin/sh

DB_FILE="/db/transcendence.db"

if [ ! -f "$DB_FILE" ]; then
	sqlite3 "$DB_FILE" < /db/transcendence.sql
fi

mkdir -p /data/public/avatars
if [ ! -f /data/public/avatars/default.png ]; then
    cp /db/default.png /data/public/avatars/default.png
fi

tail -f /dev/null