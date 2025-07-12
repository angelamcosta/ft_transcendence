import { postResult } from "./pongUtils.js";
import { profile } from "./displayPage.js";

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

async function waitForCliBoot(
	matchId: string,
	signal: AbortSignal,
	timeoutMs = 5000,
	intervalMs = 150
): Promise<boolean> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		if (signal.aborted)
			return false;
		try {
			const res = await fetch(
				`/game/${matchId}/boot`,
				{ method: 'GET', credentials: 'include' }
			);
			if (res.ok) {
				const { booted } = await res.json() as { booted: boolean };
				if (booted) return true;
			}
		} catch (err: any) {
			if (err.name === 'AbortError') return false;
		}
		await new Promise(r => setTimeout(r, intervalMs));
	}
	return false;
}

export async function initPong(
	workArea: HTMLDivElement, canvas: HTMLCanvasElement,
	player_one?: string, player_two?: string,
	player1_id?: string, player2_id?: string,
	countdownDiv?: HTMLDivElement
) {
	const params = new URLSearchParams(window.location.search);
	const matchId = params.get('matchId');
	let cliBooted: boolean;

	const container = canvas.parentElement!;
	container.style.position = 'relative';
	canvas.style.display = 'block';
	if (!matchId) {
		const overlay = document.createElement('div');
		overlay.className = 'fixed inset-0 flex items-center justify-center bg-black/50 gap-4';
		overlay.innerHTML = `
			<button id="btn-2p" class="px-4 py-2 text-lg font-mono text-white hover:underline"">
			2 Players
			</button>
			<button id="btn-ai" class="px-4 py-2 text-lg font-mono text-white hover:underline"">
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
		const controller = new AbortController()
		const waitOverlay = document.createElement('div');
		waitOverlay.className =
  		'fixed top-0 left-0 w-screen h-screen flex flex-col items-center justify-center ' +
  		'bg-black/70 text-white text-[1.2rem]';

		waitOverlay.innerHTML = `
		<div class="flex flex-col items-center space-y-2">
			<pre class="m-0 whitespace-pre font-mono text-center">
		W/S &lt;-                              -&gt; Up/Down
		Init CLI or press Skip to start immediately...
			</pre>
			<button id="btn-skip" class="font-mono text-white hover:underline">
			Skip Waiting
			</button>
		</div>`;

		container.appendChild(waitOverlay);

		const skipPromise = new Promise<boolean>(resolve => {
			waitOverlay
				.querySelector<HTMLButtonElement>('#btn-skip')!
				.addEventListener('click', () => controller.abort());
		});
		const bootPromise = waitForCliBoot(matchId, controller.signal, 30000, 500);

		cliBooted = await Promise.race([bootPromise, skipPromise]);
		waitOverlay.remove();
		if (cliBooted) {
			await fetch(`/game/${matchId}/boot/disable`,{ method: 'POST', credentials: 'include'});
			launchGame(false, matchId);
			return;
		}
		await fetch(`/game/create/${matchId}`, { method: 'POST', credentials: 'include' });
		await fetch(`/game/${matchId}/init`, { method: 'POST', credentials: 'include' });
		await fetch(`/game/${matchId}/start`, { method: 'POST', credentials: 'include' });
		launchGame(false, matchId);
	}

	function launchGame(vsComputer: boolean, matchId?: string) {
		let gameActive = true;

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
			if (!gameActive) return;
			if (matchId && !cliBooted) {
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
					if (e.code === 'ArrowUp') sendControl(0, 'up');
					if (e.code === 'ArrowDown') sendControl(0, 'down');
				} else {
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

		socket.addEventListener('close', () => {
			gameActive = false;
			activeSocket = null;
			gameListenersAdded = false;
		})

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
						btn.className = `
						absolute top-[60%] left-1/2 
						-translate-x-1/2 -translate-y-1/2
						px-4 py-2 text-lg font-mono text-white hover:underline
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
						postResult(matchId, s1, s2, player1_id, player2_id);
						let countdown = 5;
						if (countdownDiv)
							countdownDiv.innerText = `Redirecting in ${countdown}…`;
						const timer = setInterval(() => {
							countdown--;
							if (countdownDiv)
								countdownDiv.innerText = `Redirecting in ${countdown}…`;
							if (countdown <= 0) {
								clearInterval(timer);
								profile(workArea, localStorage.getItem('userId'!));
							}
						}, 1000);
					}
				}
			}
		}
	}
}
