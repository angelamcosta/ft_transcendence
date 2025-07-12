import { EventEmitter } from "events";

export class GameService extends EventEmitter {
    constructor() {
        super();
        this.reset();
        this.width = 1000;
        this.height = 600;
        this.intervalId = null;
        this.resetTimeout = null;
    }

    reset() {
        this.state = {
            ball: {
                x: 500,
                y: 300,
                vx: 5,
                vy: Math.floor(Math.random() * 11) - 5,
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
            if (p.up) p.y -= 8;
            if (p.down) p.y += 8;
            p.y = Math.max(0, Math.min(this.height - p.height, p.y));
        });

        let b = this.state.ball;

        b.x += b.vx;
        b.y += b.vy;

        if (b.y <= 0 || b.y >= this.height)
            b.vy *= -1;
        this.state.players.forEach((p, i) => {
            const playerX = i === 0 ? 0 : this.width - 10;
            const playerWidth = 10;
            const playerHeight = 100;
            if ((i === 0 && b.x < playerX + playerWidth) ||
                (i === 1 && b.x > playerX)) {
                if (b.y > p.y && b.y < p.y + playerHeight) {
                    const hitPosition = (b.y - p.y) / playerHeight;
                    const angle = hitPosition * Math.PI - Math.PI / 2;
                    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy) * 1.1;
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
        if (b.x < -10) {
            this.state.scores[1]++;
            this.resetBall();
        } else if (b.x > this.width + 10) {
            this.state.scores[0]++;
            this.resetBall();
        }

        this.emit("state", this.state);
    }

    resetBall() {
        clearInterval(this.intervalId);
        this.intervalId = null;

        const b = this.state.ball;
        b.x = this.width / 2;  // Centro horizontal
        b.y = this.height / 2; // Centro vertical
        b.vx = b.vx > 0 ? -5 : 5;
        b.vy = Math.floor(Math.random() * 11) - 5;

        // Adiciona um pequeno delay para dar tempo de ver o placar
        clearInterval(this.intervalId);
        this.intervalId = null;

        this.resetTimeout = setTimeout(() => {
            this.resetTimeout = null;
            this.start();
        }, 1000);
    }

    stop() {
        if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        }
        if (this.resetTimeout) {
        clearTimeout(this.resetTimeout);
        this.resetTimeout = null;
        }
        this.reset();
        this.emit("ended", this.state);
    }

    control(playerIndex, action) {
        let p = this.state.players[playerIndex];
        p.up = action === "up";
        p.down = action === "down";
    }
}
