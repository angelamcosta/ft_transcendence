import { clients } from './app.mjs'
import { WebSocket as ws } from 'ws';

export async function chatRoutes(app) {
	app.post('/notify/semis', async (req, reply) => {
		const { semi1, semi2, tourName } = req.body;
		const notification = JSON.stringify({
			type: 'tournament-semis',
			semi1,
			semi2,
			tourName
		});
		for (const client of clients) {
			if (client.readyState === ws.OPEN)
				client.send(notification);
		}
		return reply.code(200).send({ success: true });
	});

	app.post('/notify/finals', async (req, reply) => {
		const { player1, player2, tourName } = req.body;
		const notification = JSON.stringify({
			type: 'tournament-finals',
			player1,
			player2,
			tourName
		});
		for (const client of clients) {
			if (client.readyState === ws.OPEN)
				client.send(notification);
		}
		return reply.code(200).send({ success: true });
	});
}
