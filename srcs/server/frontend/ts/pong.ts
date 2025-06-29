let activeSocket: WebSocket | null = null;
let animationId: number | null = null;
let gameListenersAdded = false;

export async function initPong(canvas: HTMLCanvasElement) {
  if (activeSocket) {
    console.log('⚠️ Fechando WebSocket antigo');
    activeSocket.close();
    activeSocket = null;
  }
  if (animationId) {
    console.log('⚠️ Cancelando loop antigo');
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  const ctx = canvas.getContext('2d')!;
  type GameState = {
    ball: { x: number; y: number };
    players: { y: number }[];
    scores: number[];
  };
  let state: GameState | undefined;

  const socket = new WebSocket(`wss://${window.location.hostname}:${window.location.port}/api/game/ws`);
  activeSocket = socket;

  socket.addEventListener('open', () => {
    console.log('WebSocket conectado ao jogo!');
    socket.send(JSON.stringify({ type: 'start' }));

    const loop = () => {
      draw();
      animationId = requestAnimationFrame(loop);
    };
    loop();
  });

  socket.addEventListener('message', async ev => {
    let dataStr: string;

    if (typeof ev.data === 'string') {
      dataStr = ev.data;
    } else if (ev.data instanceof ArrayBuffer) {
      dataStr = new TextDecoder().decode(ev.data);
    } else if (ev.data instanceof Blob) {
      dataStr = await ev.data.text();
    } else {
      console.error('Formato de mensagem não suportado:', ev.data);
      return;
    }

    try {
      const msg = JSON.parse(dataStr);
      if (msg.type === 'state') {
        state = msg.data;
        console.log('Estado recebido:', state);
      }
    } catch (err) {
      console.error('Erro ao analisar JSON:', err, 'Dados:', dataStr);
    }
  });

  const sendControl = (player: number, action: 'up' | 'down' | '') => {
    socket.send(JSON.stringify({
      type: 'control',
      data: {
        player,
        action: action
      }
    }));
    console.log('Controle enviado:', { player, action });
  };

  if (!gameListenersAdded) {
    window.addEventListener('keydown', e => {
      if (e.code === 'ArrowUp') sendControl(0, 'up');
      if (e.code === 'ArrowDown') sendControl(0, 'down');
    });
    window.addEventListener('keyup', e => {
      if (['ArrowUp', 'ArrowDown'].includes(e.code)) sendControl(0, '');
    });
    gameListenersAdded = true;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!state) return;

    ctx.fillStyle = 'white';
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
