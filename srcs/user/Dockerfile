FROM debian:stable-slim

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs openssl && \
    rm -rf /var/lib/apt/lists/*

COPY ./tools/* .

RUN openssl req -x509 -newkey rsa:4096 -subj "/CN=localhost" -keyout /app/key.pem -out /app/cert.pem -days 365 -nodes

RUN npm cache clean --force && \
    npm init -y && \
    npm install fastify @fastify/cookie @fastify/multipart @fastify/sensible sqlite sqlite3 undici

CMD [ "node", "app.mjs" ]