import { EventEmitter } from 'events';

export class GameService extends EventEmitter {
    constructor() {
        super();
        this.state = {
            ball: { x: 300, y: 200, vx: 0, vy: 0 },
            paddles: [
                { x: 10, y: 150 },
                { x: 580, y: 150 },
            ],
            score: [0, 0],
        };
        this.intervalId = null;
        this.timeoutId = null;
    }

    reset() {
        clearInterval(this.intervalId);
        clearTimeout(this.timeoutId);
        this.state = {
            ball: { x: 300, y: 200, vx: 0, vy: 0 },
            paddles: [
                { x: 10, y: 150 },
                { x: 580, y: 150 },
            ],
            score: [0, 0],
        };
        this.emit('state', this.state);
    }

    start() {
        const angle = Math.random() * Math.PI * 2;
        this.state.ball.vx = 200 * Math.cos(angle);
        this.state.ball.vy = 200 * Math.sin(angle);
        this.timeoutId = setTimeout(() => {
            this.intervalId = setInterval(() => this.tick(), 1000 / 60);
        }, 1000);
    }

    control(playerIndex, direction) {
        const paddle = this.state.paddles[playerIndex];
        if (direction === 'up') paddle.y = Math.max(0, paddle.y - 10);
        if (direction === 'down') paddle.y = Math.min(400, paddle.y + 10);
        this.emit('state', this.state);
    }

    tick() {
        const b = this.state.ball;
        b.x += b.vx / 60;
        b.y += b.vy / 60;
        if (b.y < 0 || b.y > 400) b.vy *= -1;
        this.state.paddles.forEach((p, idx) => {
            if (
                b.x < p.x + 10 && b.x > p.x &&
                b.y > p.y && b.y < p.y + 100
            ) {
                b.vx *= -1.05;
            }
        });
        if (b.x < 0) {
            this.state.score[1]++;
            this.reset();
        } else if (b.x > 600) {
            this.state.score[0]++;
            this.reset();
        }
        this.emit('state', this.state);
    }
}
