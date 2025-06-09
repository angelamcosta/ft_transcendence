const canvasWidth: number = 600;
const canvasHeight: number = 600;
const playerYPosition: number = 250;
const moveSpeed: number = 1;

let ball: Ball;
let player1Points: number = 0;
let player2Points: number = 0;
let player: Player;
let player2: Player;
let interval: number;
let running: boolean = false;

interface GameCanvas {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D | null;
    start: () => void;
}

const gameCanvas: GameCanvas = {
    canvas: document.createElement("canvas"),
    context: null,
    start: function () {
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        const ctx = this.canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");
        this.context = ctx;

        document.addEventListener("keydown", logKeyDown);
        document.addEventListener("keyup", logKeyUp);
        document.addEventListener("keypress", logKeyPress);
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    },
};

class Ball {
    x!: number;
    y!: number;
    xSpeed: number;
    ySpeed!: number;
    angle?: number;

    constructor() {
        this.xSpeed = 1;
        this.resetBall();
    }

    resetBall(): void {
        this.x = 290;
        this.y = 295;
        this.ySpeed = Math.random();
        if (Math.floor(Math.random() * 2) === 0) {
            this.ySpeed *= -1;
        }
        if (Math.floor(Math.random() * 2) === 0) {
            this.xSpeed *= -1;
        }
    }

    draw(): void {
        const ctx = gameCanvas.context;
        if (!ctx) throw new Error("Canvas context not initialized");
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.arc(this.x, this.y, 5, 0, (Math.PI / 180) * 360);
        ctx.fill();
    }

    move(): void {
        this.x += this.xSpeed;
        this.y += this.ySpeed;
        this.ballHit();
    }

    ballHit(): void {
        const ground = canvasHeight - 5;
        if (this.y > ground) {
            this.y = ground;
            this.ySpeed *= -1;
        }
        if (this.y < 5) {
            this.y = 5;
            this.ySpeed *= -1;
        }

        if (this.xSpeed > 0) {
            if (this.x >= player2.x - 5 && this.x <= player2.x - 3) {
                if (this.y >= player2.y - 5 && this.y <= player2.y + 105) {
                    this.x = player2.x - 5;
                    this.xSpeed *= -1;
                    this.angle = ((player2.y + 100) - this.y) / 50;
                    this.ySpeed = (this.angle - 1) * -1;
                }
            }
            if (this.x > canvasWidth - 5) {
                player1Points += 1;
                this.resetBall();
            }
        } else {
            if (this.x <= player.x + 15 && this.x >= player.x + 13) {
                if (this.y >= player.y - 5 && this.y <= player.y + 105) {
                    this.x = player.x + 15;
                    this.xSpeed *= -1;
                    this.angle = ((player.y + 100) - this.y) / 50;
                    this.ySpeed = (this.angle - 1) * -1;
                }
            }
            if (this.x < 0) {
                player2Points += 1;
                this.resetBall();
            }
        }
    }

    invertY(): void {
        this.ySpeed *= -1;
    }
}

class Player {
    width: number;
    height: number;
    x: number;
    y: number;
    up: boolean = false;
    down: boolean = false;

    constructor(width: number, height: number, x: number) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = playerYPosition;
    }

    draw(): void {
        const ctx = gameCanvas.context;
        if (!ctx) throw new Error("Canvas context not initialized");
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    goUp(): void {
        this.y -= moveSpeed;
        this.stopPlayer();
    }

    goDown(): void {
        this.y += moveSpeed;
        this.stopPlayer();
    }

    stopPlayer(): void {
        const ground = canvasHeight - this.height;
        if (this.y > ground) {
            this.y = ground;
        }
        if (this.y < 0) {
            this.y = 0;
        }
        if (ball.x >= this.x && ball.x <= this.x + 12) {
            if (ball.y >= this.y - 5 && ball.y <= this.y + 105) {
                ball.invertY();
            }
        }
    }

    resetPosition(): void {
        this.y = 250;
    }
}

function startGame(): void {
    gameCanvas.start();
    player = new Player(10, 100, 20);
    player2 = new Player(10, 100, 570);
    ball = new Ball();
    interval = window.setInterval(updateCanvas, 1);
}

function updateCanvas(): void {
    const ctx = gameCanvas.context;
    if (!ctx) throw new Error("Canvas context not initialized");
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.font = "24px arial";
    ctx.fillText(player1Points.toString(), 10, 30);
    ctx.fillText(player2Points.toString(), 570, 30);

    ball.draw();
    player.draw();
    player2.draw();

    if (player1Points === 5 || player2Points === 5) {
        running = false;
        ctx.fillText("Press spacebar to start", 200, 30);
        player.resetPosition();
        player2.resetPosition();
        player1Points = 0;
        player2Points = 0;
    }

    if (!running) {
        ctx.fillText("Press spacebar to start", 200, 30);
    } else {
        ball.move();
        if (player.up) player.goUp();
        if (player2.up) player2.goUp();
        if (player.down) player.goDown();
        if (player2.down) player2.goDown();
    }
}

function logKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
        case "ArrowUp":
            player2.up = true;
            break;
        case "ArrowDown":
            player2.down = true;
            break;
        case "KeyW":
            player.up = true;
            break;
        case "KeyS":
            player.down = true;
            break;
    }
}

function logKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
        case "ArrowUp":
            player2.up = false;
            break;
        case "KeyW":
            player.up = false;
            break;
        case "ArrowDown":
            player2.down = false;
            break;
        case "KeyS":
            player.down = false;
            break;
    }
}

function logKeyPress(e: KeyboardEvent): void {
    if (e.code === "Space") {
        running = true;
    }
}

startGame();
