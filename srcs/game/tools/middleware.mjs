import { WebSocketServer } from 'ws';

export function attachWebSocket(server, games) {
  const wss = new WebSocketServer({ noServer: true });

  server.server.on('upgrade', (req, socket, head) => {
    if (!req.url.startsWith('/ws/')) return;
    wss.handleUpgrade(req, socket, head, ws => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws, req) => {
    const match = req.url.match(/^\/ws\/([^\/]+)$/);
    const gameId = match && match[1];
    if (!gameId || !games.has(gameId)) {
      ws.send(JSON.stringify({ error: 'Match not found' }));
      return ws.close();
    }

    const game = games.get(gameId);

    ws.send(JSON.stringify({ gameId, state: game.state }));

    const sendState = state => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ gameId, state }));
      }
    };
    game.on('state', sendState);

    ws.on('message', msg => {
      try {
        const { action, payload } = JSON.parse(msg);
        if (action === 'move') {
          game.control(payload.player, payload.direction);
        }
      } catch (e) {
      }
    });

    ws.on('close', () => {
      game.off('state', sendState);
    });
  });
}
