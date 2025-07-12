import { WebSocketServer } from 'ws';
import { GameService } from './service.mjs';

export async function validateEmptyBody(res, rep) {
	if (res.raw.method !== 'POST') return;

	const body = res.body;

	if (body === undefined || Object.keys(body).length === 0)
		return rep.code(400).send({ error: 'JSON body is empty' });
}

export function attachWebSocket(server, games) {
	const wss = new WebSocketServer({ server });
	wss.on('connection', (ws, request) => {

		const [, queryString = ''] = request.url.split('?');
		const params = new URLSearchParams(queryString);
		const matchId = params.get('matchId');

		let game;
		if (matchId) {
			game = games.get(matchId);
			if (!game) {
				ws.send(JSON.stringify({ type: 'error', message: 'Match not found' }));
				return ws.close();
			}
		} else
			game = new GameService();


		const sendState = state => { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'state', data: state })); };

		sendState(game.state);

		game.on('state', sendState);

		ws.on('message', msg => {
			let data;
			try {
				if (msg instanceof Buffer) data = JSON.parse(msg.toString());
				else if (typeof msg === 'string') data = JSON.parse(msg);
				else return;

			} catch (err) {
				console.error('Erro ao parsear mensagem:', err);
				return;
			}

			const { type, data: payload } = data;
			if (type === 'control') game.control(payload.player, payload.action);
			else if (type === 'start') game.start();
			else if (type === 'stop') game.stop();
		});

		ws.on('close', () => {
			game.removeListener('state', sendState);
			game.stop();
		});
	});
}