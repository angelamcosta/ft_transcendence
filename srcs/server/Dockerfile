FROM debian:stable-slim

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

COPY ./tools/app.mjs .
COPY ./frontend/ /app/

RUN npm cache clean --force && \
    npm init -y && \
    npm install fastify && \
    npm install @fastify/static && \
    npm install tailwindcss @tailwindcss/cli && \
    npm install typescript

# Build TailwindCSS and TypeScript
RUN npx @tailwindcss/cli -i ./style.css -o ./public/style.css --minify && \
    npx tsc

CMD [ "node", "app.mjs" ]