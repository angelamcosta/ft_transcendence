import { EventEmitter } from "events";

export class GameService extends EventEmitter {
    constructor() {
        super();
        this.reset();
        this.width = 600;
        this.height = 600;
    }

    reset() {
        this.state = {
            ball: {
                x: 300,
                y: 300,
                vx: 5,
                vy: 3,
                radius: 10
            },
            players: [
                { y: 250, up: false, down: false, width: 10, height: 100 },
                { y: 250, up: false, down: false, width: 10, height: 100 }
            ],
            scores: [0, 0]
        };
        this.emit("state", this.state);
    }

    start() {
        if (this.intervalId) return;
        this.emit("state", this.state);
        this.intervalId = setInterval(() => this.step(), 16);
    }

    step() {
        this.state.players.forEach(p => {
            if (p.up) p.y -= 4;
            if (p.down) p.y += 4;
            p.y = Math.max(0, Math.min(this.height - p.height, p.y));
        });

        let b = this.state.ball;

        b.x += b.vx;
        b.y += b.vy;

        if (b.y <= 0 || b.y >= this.height)
            b.vy *= -1;

        // Colisão com jogadores
        this.state.players.forEach((p, i) => {
            const playerX = i === 0 ? 0 : this.width - 10;
            const playerWidth = 10;
            const playerHeight = 100;

            // Verifica se a bola está na zona horizontal da raquete
            if ((i === 0 && b.x < playerX + playerWidth) ||
                (i === 1 && b.x > playerX)) {

                // Verifica colisão vertical
                if (b.y > p.y && b.y < p.y + playerHeight) {
                    // Calcula o ângulo de rebatimento baseado no local do impacto
                    const hitPosition = (b.y - p.y) / playerHeight;
                    const angle = hitPosition * Math.PI - Math.PI / 2; // -45° a +45°

                    // Calcula nova direção
                    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy) * 1.1; // Aumenta velocidade
                    b.vx = (i === 0 ? 1 : -1) * Math.cos(angle) * speed;
                    if (b.vx < 3 && b.vx > -3) {
                        if (b.vx >= 0) {
                            b.vx = 3;
                        }
                        else {
                            b.vx = -3;
                        }
                    }
                    b.vy = Math.sin(angle) * speed;
                }
            }
        });

        // Verifica pontuação
        if (b.x < -10) {  // Saiu completamente pela esquerda
            this.state.scores[1]++;
            this.resetBall();
        } else if (b.x > this.width + 10) {  // Saiu completamente pela direita
            this.state.scores[0]++;
            this.resetBall();
        }

        this.emit("state", this.state);
    }

    resetBall() {
        console.log("Resetting ball. Scores:", this.state.scores);

        const b = this.state.ball;
        b.x = this.width / 2;  // Centro horizontal
        b.y = this.height / 2; // Centro vertical
        b.vx = b.vx > 0 ? -5 : 5; // Inverte direção

        // Adiciona um pequeno delay para dar tempo de ver o placar
        clearInterval(this.intervalId);
        this.intervalId = null;

        setTimeout(() => {
            this.start();
        }, 1000); // 1 segundo de delay
    }

    control(playerIndex, action) {
        console.log(`Controle: player=${playerIndex}, action=${action}`);
        let p = this.state.players[playerIndex];
        p.up = action === "up";
        p.down = action === "down";
    }
}

// TODO : - check if the games is over (the socket connection must be closed!) (the frontend must make it very clear that the game is over, and who won, and add to the db)
// TODO : - deal with multiplayer
// TODO : - create private matches logic
// TODO : - create tournament logic