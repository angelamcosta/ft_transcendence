import { EventEmitter } from "events";

export class GameService extends EventEmitter {
    constructor() {
        super();
        this.reset();
    }

    reset() {
        this.state = {
            ball: { x: 300, y: 300, vx: 2, vy: 2 },
            players: [
                { y: 250, up: false, down: false },
                { y: 250, up: false, down: false }
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
            p.y = Math.max(0, Math.min(550, p.y));
        });

        let b = this.state.ball;
        b.x += b.vx;
        b.y += b.vy;

        this.emit("state", this.state);
    }

    control(playerIndex, action) {
        console.log(`Controle: player=${playerIndex}, action=${action}`);
        let p = this.state.players[playerIndex];
        p.up = action === "up";
        p.down = action === "down";
    }
}
