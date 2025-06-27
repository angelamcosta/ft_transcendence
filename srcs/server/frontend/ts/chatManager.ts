export let globalSocket: WebSocket | null = null;
export const onlineUsers = new Set<string>();
export const unreadDM = new Set<string>();

export function initGlobalChat(userId: string, display_name: string) {
	if (globalSocket) return;

	const wsUrl = `wss://localhost:9000/chat`;
	const ws = new WebSocket(wsUrl);
	ws.binaryType = 'arraybuffer';

	ws.addEventListener('open', () => {
		ws.send(JSON.stringify({ type: 'identify', userId }));
	});

	ws.addEventListener('message', async evt => {
		let dataStr: string;
		if (typeof evt.data === 'string')
			dataStr = evt.data;
		else if (evt.data instanceof Blob)
			dataStr = await evt.data.text();
		else
			dataStr = new TextDecoder().decode(evt.data);

		const msg = JSON.parse(dataStr);

		switch (msg.type) {
			case 'list':
				onlineUsers.clear();
				msg.users.forEach((n: string) => onlineUsers.add(n));
				break;
			case 'identify':
				onlineUsers.add(display_name);
			case 'join':
				onlineUsers.add(msg.display_name);
				break;
			case 'leave':
				onlineUsers.delete(msg.display_name);
				break;
		}
		window.dispatchEvent(new CustomEvent('global-presence-updated'));
	});

	ws.addEventListener('close', () => {
		globalSocket = null;
		onlineUsers.clear();
		window.dispatchEvent(new CustomEvent('global-presence-updated'));
	});
	
	ws.addEventListener('error', err => console.error('Global chat error', err));
	globalSocket = ws;
}

export function cleanGlobalChat() {
	if (globalSocket) {
		globalSocket.close();
		globalSocket = null;
	}
	onlineUsers.clear();
}
