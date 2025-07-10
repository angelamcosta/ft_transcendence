import { postResult } from "./pongUtils.js";

let activeSocket: WebSocket | null = null;
let animationId: number | null = null;
let gameListenersAdded = false;
const PADDLE_HEIGHT = 100;
const HALF_PADDLE = PADDLE_HEIGHT / 2;
const VICTORY_SCORE = 5;
const isDarkMode = window.matchMedia &&
	window.matchMedia('(prefers-color-scheme: dark)').matches;

export function stopGame() {
	if (animationId) {
		cancelAnimationFrame(animationId);
		animationId = null;
	}
	if (activeSocket) {
		activeSocket.close();
		activeSocket = null;
	}
}
(window as any).stopGame = stopGame;

export async function initPong(
	workArea: HTMLDivElement, canvas: HTMLCanvasElement,
	player_one?: string, player_two?: string,
	player1_id?: string, player2_id?: string,
	countdownDiv?: HTMLDivElement
) {

	const params = new URLSearchParams(window.location.search);
	const matchId = params.get('matchId');

	const container = canvas.parentElement!;
	container.style.position = 'relative';
	if (!matchId) {
		canvas.style.display = 'none';
		const overlay = document.createElement('div');
		overlay.style.cssText = `
			position: fixed; top:0; left:0; 
			width:100vw; height:100vh; 
			display:flex; align-items:center; justify-content:center;
			background: rgba(0,0,0,0.5);
		`;
		overlay.innerHTML = `
			<button id="btn-2p" style="margin-right:1rem;padding:1rem 2rem;font-size:1.2rem">
			2 Players
			</button>
			<button id="btn-ai" style="padding:1rem 2rem;font-size:1.2rem">
			Vs Computer
			</button>
		`;
		container.appendChild(overlay);

		(overlay.querySelector('#btn-2p') as HTMLButtonElement)
			.addEventListener('click', () => {
				overlay.remove();
				canvas.style.display = 'block';
				gameListenersAdded = false;
				launchGame(false);
			});
		(overlay.querySelector('#btn-ai') as HTMLButtonElement)
			.addEventListener('click', () => {
				overlay.remove(); canvas.style.display = 'block';
				gameListenersAdded = false;
				launchGame(true);
			});
	} else {
		await fetch(`/game/create/${matchId}`, { method: 'POST', credentials: 'include' });
		await fetch(`/game/${matchId}/init`, { method: 'POST', credentials: 'include' });
		launchGame(false, matchId);
		const overlay = document.createElement('div');
		overlay.style.cssText = `
			position: fixed; top:0; left:0; 
			width:100vw; height:100vh; 
			display:flex; align-items:center; justify-content:center;
			background: rgba(0,0,0,0.5);
		`;

		overlay.innerHTML = `
			<button id="btn-start" style="margin-right:1rem;padding:1rem 2rem;font-size:1.2rem">
			Start Game
			</button>
		`;

		container.appendChild(overlay);

		(overlay.querySelector('#btn-start') as HTMLButtonElement)
			.addEventListener('click', async () => {
				overlay.remove();
				canvas.style.display = 'block';
				gameListenersAdded = false;
				await fetch(`/game/${matchId}/start`, { method: 'POST', credentials: 'include' });
			});
	}

	function launchGame(vsComputer: boolean, matchId?: string) {
		if (activeSocket) {
			activeSocket.close();
			activeSocket = null;
		}
		if (animationId) {
			cancelAnimationFrame(animationId);
			animationId = null;
		}

		const ctx = canvas.getContext('2d')!;
		type GameState = {
			ball: { x: number; y: number; radius: number };
			players: { y: number }[];
			scores: number[];
		};
		let state: GameState | undefined;
		let lastCPUAction: '' | 'up' | 'down' = '';

		const base = `wss://${window.location.host}/api/game/wss`;
		const wsUrl = matchId ? `${base}?matchId=${matchId}` : base;
		const socket = new WebSocket(wsUrl);
		activeSocket = socket;

		socket.addEventListener('open', () => {
			if (!matchId)
				socket.send(JSON.stringify({ type: 'start' }));
			const loop = () => {
				draw();
				animationId = requestAnimationFrame(loop);
			};
			loop();
		});

		socket.addEventListener('message', async ev => {
			const dataStr = typeof ev.data === 'string'
				? ev.data
				: ev.data instanceof Blob
					? await ev.data.text()
					: new TextDecoder().decode(ev.data as ArrayBuffer);
			try {
				const msg = JSON.parse(dataStr);
				if (msg.type === 'state') {
					state = msg.data as GameState;
					// IA simples no cliente
					if (vsComputer && state) {
						const targetY = state.ball.y - HALF_PADDLE;
						let action: '' | 'up' | 'down' = '';
						if (targetY > state.players[1].y) action = 'down';
						else if (targetY < state.players[1].y) action = 'up';
						if (action !== lastCPUAction) {
							sendControl(1, action);
							lastCPUAction = action;
						}
					}
				}
			} catch { /**/ }
		});

		const lastSent: Record<number, '' | 'up' | 'down'> = { 0: '', 1: '' };

		async function sendControl(player: number, action: '' | 'up' | 'down') {
			if (matchId) {
				if (lastSent[player] === action) return;
				lastSent[player] = action;
				const a = action === '' ? 'none' : action;
				await fetch(
					`/game/${matchId}/control/${player}/${a}`,
					{ method: 'POST', credentials: 'include' }
				).catch(console.error);
			} else {
				if (socket.readyState === WebSocket.OPEN) {
					socket.send(JSON.stringify({
						type: 'control',
						data: { player, action }
					}));
				}
			}
		}

		if (!gameListenersAdded) {
			window.addEventListener('keydown', e => {
				if (vsComputer) {
					// vs CPU: usado apenas ↑ ↓ para o Player 1 (índice 0)
					if (e.code === 'ArrowUp') sendControl(0, 'up');
					if (e.code === 'ArrowDown') sendControl(0, 'down');
				} else {
					// PvP: W/S para Player 1 (índice 0); ↑/↓ para Player 2 (índice 1)
					if (e.code === 'KeyW') sendControl(0, 'up');
					if (e.code === 'KeyS') sendControl(0, 'down');
					if (e.code === 'ArrowUp') sendControl(1, 'up');
					if (e.code === 'ArrowDown') sendControl(1, 'down');
				}
			});

			window.addEventListener('keyup', e => {
				if (vsComputer) {
					if (['ArrowUp', 'ArrowDown'].includes(e.code))
						sendControl(0, '');
				} else {
					if (['KeyW', 'KeyS'].includes(e.code))
						sendControl(0, '');
					if (['ArrowUp', 'ArrowDown'].includes(e.code))
						sendControl(1, '');
				}
			});
			gameListenersAdded = true;
		}

		async function draw() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			if (!state) return;

			const bg = isDarkMode ? 'black' : 'white';
			const fg = isDarkMode ? 'white' : 'black';
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.fillStyle = fg;
			ctx.beginPath();
			ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
			ctx.fill();

			state.players.forEach((p, i) => {
				const x = i === 0 ? 0 : canvas.width - 10;
				ctx.fillRect(x, p.y, 10, PADDLE_HEIGHT);
			});

			ctx.font = '30px sans-serif';
			ctx.fillStyle = fg;
			ctx.fillText(
				(state.scores[0] ?? 0).toString(),
				canvas.width / 4, 50
			);
			ctx.fillText(
				(state.scores[1] ?? 0).toString(),
				(canvas.width * 3) / 4, 50
			);

			const [s1, s2] = [state.scores[0] || 0, state.scores[1] || 0];
			if (s1 >= VICTORY_SCORE || s2 >= VICTORY_SCORE) {
				cancelAnimationFrame(animationId!);
				activeSocket?.close();
				const p1 = player_one ?? 'Player 1';
				const p2 = player_two ?? (vsComputer ? 'Computer' : 'Player 2');
				const winner = s1 > s2 ? p1 : p2;
				const message = `${winner} won!`;
				ctx.fillStyle = 'red';
				ctx.font = '40px sans-serif';
				ctx.textBaseline = 'bottom';
				const textWidth = ctx.measureText(message).width;
				const x = (canvas.width - textWidth) / 2;
				const marginBottom = 30;
				const y = canvas.height - marginBottom;
				ctx.fillText(message, x, y);

				if (!matchId) {
					if (!document.querySelector('#btn-restart')) {
						const btn = document.createElement('button');
						btn.id = 'btn-restart';
						btn.textContent = 'Restart Game';
						btn.style.cssText = `
							position: absolute;
							top: 60%;
							left: 50%;
							transform: translate(-50%, -50%);
							padding: 1rem 2rem;
							font-size: 1.2rem;
							z-index: 100;
						`;
						btn.addEventListener('click', () => {
							btn.remove();
							gameListenersAdded = false;
							launchGame(vsComputer);
						});
						container.appendChild(btn);
					}
				} else if (matchId && player1_id && player2_id) {
					if (!canvas.dataset.resultPosted) {
						canvas.dataset.resultPosted = 'true';
						let countdown = 5;
						if (countdownDiv)
							countdownDiv.innerText = `Redirecting in ${countdown}…`;
						const timer = setInterval(() => {
							countdown--;
							if (countdownDiv)
								countdownDiv.innerText = `Redirecting in ${countdown}…`;
							if (countdown <= 0) {
								clearInterval(timer);
								postResult(workArea, matchId, s1, s2, player1_id, player2_id)
							}
						}, 1000);
					}
				}
			}
		}
	}
}
