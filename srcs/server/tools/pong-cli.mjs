#!/usr/bin/env node
import axios from 'axios';
import WebSocket from 'ws';
import https from 'https';
import readline from 'readline';

const [, , matchId, email, password] = process.argv;
if (!matchId) {
	console.error('Usage: ./pong-cli.js <matchId> <email> <password>');
	process.exit(1);
}

const HOST = 'https://localhost:9000';
const agent = new https.Agent({ rejectUnauthorized: false });

async function main() {
	try {
		const loginRes = await axios.post(
			`${HOST}/login`,
			{ email: `${email}`, password: `${password}` },
			{ httpsAgent: agent }
		);

		const setCookie = loginRes.headers['set-cookie'];
		if (!setCookie) throw new Error('No Set-Cookie header from /login');
		const cookieHeader = setCookie.map(c => c.split(';')[0]).join('; ');

		console.log('Authorized with the token\n\n', cookieHeader, '\n\n');

		const post = (url) => axios.post(
			`${HOST}${url}`,
			{},
			{ httpsAgent: agent, headers: { Cookie: cookieHeader } }
		);

		await post(`/game/${matchId}/init`);
		await post(`/game/${matchId}/start`);
		console.log(`Game ${matchId} initialized & started.`);

		const ws = new WebSocket(`${HOST.replace(/^https/, 'wss')}/api/game/wss?matchId=${matchId}`, {
			agent,
			headers: { Cookie: cookieHeader },
			rejectUnauthorized: false
		});

		ws.on('open', () => {
			console.log('Connected to game socket. Use ↑/↓ for player 0, W/S for player 1. ESC to quit.');
		});

		ws.on('message', data => {
			const msg = JSON.parse(data.toString());
			if (msg.type === 'state') {
				const { ball, scores } = msg.data;
				process.stdout.write(`\rScores: ${scores[0]} – ${scores[1]} | Ball @ (${ball.x.toFixed(0)},${ball.y.toFixed(0)})`);
				if ((scores[0] || scores[1]) === 5) {
					process.stdout.write('\nGame finished! Exiting...\n');
					process.exit(0);
				}
			} else if (msg.type === 'error') {
				console.error('\nServer error:', msg.message);
			}
		});

		ws.on('close', () => {
			console.log('\nConnection closed.');
			process.exit(0);
		});

		async function doControl(player, action, cookie) {
			try {
				await axios.post(
					`${HOST}/game/${matchId}/control/${player}/${action}`,
					{},
					{ httpsAgent: agent, headers: { Cookie: cookie } }
				);
			} catch (e) {}
		}

		const repeat = { 0: null, 1: null };
		const release = { 0: null, 1: null };

		function schedule(player, action) {
			if (release[player]) clearTimeout(release[player]);

			if (!repeat[player]) {
				doControl(player, action, cookieHeader);
				repeat[player] = setInterval(() => {
					doControl(player, action, cookieHeader);
				}, 50);
			}

			release[player] = setTimeout(() => {
				clearInterval(repeat[player]);
				repeat[player] = null;
				doControl(player, 'none', cookieHeader);
			}, 150);
		}

		readline.emitKeypressEvents(process.stdin);
		process.stdin.setRawMode(true);
		process.stdin.on('keypress', (str, key) => {
			if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
				ws.close();
				return;
			}
			let player, action;
			switch (key.name) {
				case 'up': player = 0; action = 'up'; break;
				case 'down': player = 0; action = 'down'; break;
				case 'w': player = 1; action = 'up'; break;
				case 's': player = 1; action = 'down'; break;
				default:
					return;
			}
			schedule(player, action);
		});

	} catch (err) {
		console.error('Error:', err.response?.data || err.message);
		process.exit(1);
	}
}

main();
