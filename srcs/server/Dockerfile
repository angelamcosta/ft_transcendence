FROM debian:stable-slim

RUN apt-get update -y && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY ./tools .

RUN npm install && \
    npx tsc --rootDir . --outDir dist app.ts

CMD [ "node", "dist/app.js" ]