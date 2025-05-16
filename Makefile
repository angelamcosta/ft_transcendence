all: build up

build:
	mkdir -p ./data/sqlite
	mkdir -p ./data/public/avatars
	mkdir -p ./data/public/images
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

clean:
	docker-compose down -v
	docker container prune --force
	docker image prune -a --force
	docker volume prune -a --force
	docker builder prune -a --force
	sudo rm -rf ./data/sqlite
	sudo rm -rf ./data/public/avatars
	sudo rm -rf ./data/public/images

re: clean all
