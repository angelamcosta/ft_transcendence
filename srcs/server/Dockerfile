FROM debian:stable-slim

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

COPY ./tools/app.mjs .

RUN npm cache clean --force && \
    npm init -y && \
    npm install fastify && \
    npm install tailwindcss @tailwindcss/cli \
	npm install @fastify/cors \
	npm install undici

CMD [ "node", "app.mjs" ]