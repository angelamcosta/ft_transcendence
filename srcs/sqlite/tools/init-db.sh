#!/bin/sh

DB_FILE="/db/transcendence.db"

if [ ! -f "$DB_FILE" ]; then
	sqlite3 "$DB_FILE" < /db/transcendence.sql
fi

tail -f /dev/null