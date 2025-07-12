import { getUsers, User } from './utils.js';
import { directMessagePage } from './displayPage.js';

export let globalSocket: WebSocket | null = null;
export const onlineUsers = new Set<string>();
export const unreadDM = new Set<string>();

export interface ChatMessage {
	display_name: string;
	content: string;
	timestamp: number;
}

let activeDM: string | null = null

export function getActiveDM() {
	return activeDM;
}

export function setActiveDM(name: string | null) {
	if (name)
		activeDM = name;
	else
		activeDM = null;
}

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

export async function getUnreadMessages() {
	unreadDM.clear();
	try {
		const res = await fetch('/users/dm/unread', {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			},
			credentials: 'include'
		});

		if (!res.ok) return;

		const { unread } = await res.json();
		unread.forEach((name: string) => unreadDM.add(name));
		window.dispatchEvent(new CustomEvent('global-presence-updated'));
	} catch (error) {
		console.error('Error fetching unread messages', error);
	}
}

export async function fetchFriendStatus(targetId: number) {
	return fetch(`/users/friends/status/${targetId}`, { credentials: 'include' }).then(r => r.json());
}

export async function updateBlockUI(targetId: number,
	dmCard: HTMLDivElement,
	chatContainer: HTMLDivElement,
	messageInput: HTMLInputElement,
	sendBtn: HTMLButtonElement,
	banner: HTMLDivElement
) {
	const { blockedByMe, blockedByTarget } = await fetch(`/users/block/relationship/${targetId}`,
		{ credentials: 'include' }).then(r => r.json());

	if (blockedByMe)
		banner.textContent = 'You have blocked this user';
	else if (blockedByTarget)
		banner.textContent = 'You have been blocked by this user';

	if (blockedByMe || blockedByTarget) {
		if (!banner.isConnected)
			dmCard.insertBefore(banner, chatContainer);
	} else {
		if (banner.isConnected)
			banner.remove();
	}
	const disabled = blockedByMe || blockedByTarget;
	chatContainer.classList.toggle('opacity-50', blockedByMe || blockedByTarget);
	messageInput.disabled = disabled;
	sendBtn.disabled = disabled;
}

export function renderUserList(
	users: User[],
	userListContainer: HTMLDivElement,
	display_name: string
) {
	userListContainer.innerHTML = '';
	const online = users.filter(u => onlineUsers.has(u.display_name));
	const offline = users.filter(u => !onlineUsers.has(u.display_name));

	const render = (u: User) => {
		const el = document.createElement('div');
		el.classList.add(
			'flex',
			'items-center',
			'justify-start',
			'py-1',
			'px-2',
			u.display_name === display_name ? 'cursor-default' : 'cursor-pointer'
		);
		const dot = document.createElement('span');
		dot.classList.add(
			'w-2',
			'h-2',
			'rounded-full',
			onlineUsers.has(u.display_name) ? 'bg-green-500' : 'bg-transparent',
			'mr-2',
			'flex-shrink-0',
		);
		el.append(dot);

		const nameEl = document.createElement('span');
		nameEl.textContent = u.display_name;
		nameEl.classList.add(
			u.display_name === display_name ? 'font-bold' : 'font-normal'
		);
		if (unreadDM.has(u.display_name))
			nameEl.classList.add('animate-[blink-color_1s_infinite]');
		el.append(nameEl);

		if (u.display_name !== display_name) {
			el.addEventListener('click', () =>
				openDirectMessage(display_name, u.display_name, u.id)
			);
		}

		userListContainer.append(el);
	};

	online.forEach(render);
	offline.forEach(render);
}

export function setupGlobalChatSocket(
	users: User[],
	userListContainer: HTMLDivElement,
	chatContainer: HTMLDivElement,
	userId: string,
	display_name: string
) {
	globalSocket!.addEventListener('open', () => {
		globalSocket!.send(JSON.stringify({ type: 'identify', userId: userId }));
	});

	globalSocket!.addEventListener('message', async evt => {
		let dataStr: string;
		if (typeof evt.data === 'string')
			dataStr = evt.data;
		else if (evt.data instanceof Blob)
			dataStr = await evt.data.text();
		else
			dataStr = new TextDecoder().decode(evt.data);

		const msg = JSON.parse(dataStr);
		switch (msg.type) {
			case 'rename':
				users.splice(0, users.length, ...(await getUsers()))
				onlineUsers.delete(msg.old);
				onlineUsers.add(msg._new);
				renderUserList(users, userListContainer, display_name);
				appendSystemMessage(chatContainer, `${msg.old} is now known as ${msg._new}`);
				break;
			case 'identify':
				renderUserList(users, userListContainer, display_name);
				break;
			case 'join':
				renderUserList(users, userListContainer, display_name);
				appendSystemMessage(chatContainer, `${msg.display_name} joined the chat`);
				break;
			case 'leave':
				renderUserList(users, userListContainer, display_name);
				appendSystemMessage(chatContainer, `${msg.display_name} left the chat`);
				break;
			case 'dm-notification':
				if (msg.from !== getActiveDM()) {
					unreadDM.add(msg.from);
					renderUserList(users, userListContainer, display_name);
				}
				break;
			case 'message':
				appendMessage(chatContainer, {
					display_name: msg.display_name,
					content: msg.content,
					timestamp: msg.timestamp,
				}, display_name);
				break;
		}
	});

	globalSocket!.addEventListener('error', e => console.error('Global Chat Socket error', e));
}

export function sendMessage(
	input: HTMLInputElement,
	chatContainer: HTMLDivElement,
	name: string
) {
	const content = input.value.trim();
	if (!content) return;
	globalSocket!.send(JSON.stringify({ type: 'message', content }));
	appendMessage(chatContainer, {
		display_name: name,
		content,
		timestamp: Date.now()
	}, name);
	input.value = '';
}

export function appendMessage(
	chatContainer: HTMLDivElement,
	msg: ChatMessage,
	name: string
) {
	const wrap = document.createElement('div');
	wrap.className = 'mb-2';

	const isMine = msg.display_name === name;
	const alignClass = isMine ? 'text-right' : 'text-left';

	const line = document.createElement('div');
	line.className = alignClass;
	line.textContent = `${msg.display_name}: ${msg.content}`;
	wrap.append(line);

	const time = document.createElement('div');
	time.className = `${alignClass} mt-0.5 text-xs text-gray-600`;
	time.textContent = new Date(msg.timestamp).toLocaleTimeString([], {
		hour: '2-digit', minute: '2-digit'
	});
	wrap.append(time);

	chatContainer.append(wrap);
	chatContainer.scrollTop = chatContainer.scrollHeight;
}

export function appendSystemMessage(
	chatContainer: HTMLDivElement,
	text: string
) {
	const line = document.createElement('div');
	line.className = 'text-center italic';
	line.textContent = text;
	chatContainer.append(line);
	chatContainer.scrollTop = chatContainer.scrollHeight;
}

export function openDirectMessage(
	display_name: string,
	targetName: string,
	targetId: number
) {
	setActiveDM(targetName);
	if (unreadDM.has(targetName)) {
		unreadDM.delete(targetName);
	}
	directMessagePage(
		document.getElementById('appArea') as HTMLDivElement,
		document.getElementById('headArea') as HTMLDivElement,
		display_name, targetName,
		localStorage.getItem('userId')!, targetId
	);
}
