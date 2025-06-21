export function initPong(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;

  let state: {
    ball: { x: number; y: number };
    players: { y: number }[];
    scores: number[];
  };

  const socket = new WebSocket(
    window.location.origin.replace(/^http/, 'ws') + '/api/game/ws'
  );

  socket.addEventListener('open', () => {
    fetch('/api/game/init', { method: 'POST' });
    fetch('/api/game/start', { method: 'POST' });

    const loop = () => {
      draw();
      requestAnimationFrame(loop);
    };
    loop();
  });

  socket.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'state') {
      state = msg.data;
    }
  });

  const sendControl = (player: number, action: 'up' | 'down' | 'stop') => {
    socket.send(JSON.stringify({ type: 'control', data: { player, action } }));
  };

  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowUp') sendControl(0, 'up');
    if (e.code === 'ArrowDown') sendControl(0, 'down');
  });

  window.addEventListener('keyup', e => {
    if (['ArrowUp', 'ArrowDown'].indexOf(e.code) !== -1) {
      sendControl(0, 'stop');
    }
  });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!state) return;
    ctx.fillRect(state.ball.x, state.ball.y, 10, 10);
    state.players.forEach((p, i) => {
      const x = i === 0 ? 0 : canvas.width - 10;
      ctx.fillRect(x, p.y, 10, 100);
    });
    ctx.font = '30px sans-serif';
    ctx.fillText(state.scores[0].toString(), canvas.width / 4, 50);
    ctx.fillText(state.scores[1].toString(), (canvas.width * 3) / 4, 50);
  }
}
