FROM debian:stable-slim

WORKDIR /db

RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt install -y sqlite3 && \
    apt-get clean

COPY ./tools/init-db.sh /db/init-db.sh
COPY ./tools/transcendence.sql /db/transcendence.sql

RUN chmod +x /db/init-db.sh

ENTRYPOINT ["/bin/sh", "/db/init-db.sh"]