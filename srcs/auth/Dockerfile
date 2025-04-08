FROM debian:stable-slim

WORKDIR /auth

RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get install -y nodejs npm python3 make g++

COPY ./tools/package.json .
	
RUN npm cache clean --force && \
    npm install fastify
	
COPY ./tools/app.mjs .

CMD [ "node", "app.mjs" ]