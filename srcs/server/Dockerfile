FROM debian:stable-slim

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

COPY ./tools/ .
COPY ./frontend/ /app/

RUN openssl req -x509 -newkey rsa:4096 -subj "/CN=localhost" -keyout /app/key.pem -out /app/cert.pem -days 365 -nodes

RUN npm cache clean --force && \
    npm init -y && \
    npm install fastify && \
    npm install tailwindcss @tailwindcss/cli && \
	npm install @fastify/cors && \
	npm install ws && \
	npm install undici && \
    npm install @fastify/static && \
    npm install @fastify/websocket && \
	npm install @fastify/cookie && \
    npm install typescript && \
	npm install sqlite && \
	npm install sqlite3 && \
	npm install axios

# Build TailwindCSS and TypeScript
RUN npx @tailwindcss/cli -i ./style.css -o ./public/style.css --minify && \
    npx tsc

CMD [ "node", "app.mjs" ]