FROM debian:stable-slim

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

COPY ./tools/* .

RUN npm cache clean --force && \
    npm init -y && \
    npm install fastify sqlite sqlite3

CMD [ "node", "app.mjs" ]