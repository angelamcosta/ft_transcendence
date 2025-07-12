import * as utils from './utils.js'
import { fetchFriendStatus } from './globalChatManager.js'
import { updateBlockUI } from './globalChatManager.js'
import { profile } from './displayPage.js'

export interface ChatMessage {
	display_name: string
	content: string
	timestamp: number
}

export function setupDmChatSocket(
	targetName: string,
	userId: string,
	display_name: string,
	chatContainer: HTMLDivElement
): WebSocket {
	const wsUrl = `wss://localhost:9000/dm`;
	const ws = new WebSocket(wsUrl);
	ws.binaryType = 'arraybuffer';

	ws.onopen = () => {
		ws.send(JSON.stringify({
			type: 'direct-join',
			targetName
		}));
	};

	ws.onmessage = async evt => {
		let dataStr: string;
		if (typeof evt.data === 'string')
			dataStr = evt.data;
		else if (evt.data instanceof Blob)
			dataStr = await evt.data.text();
		else
			dataStr = new TextDecoder().decode(evt.data);

		const msg = JSON.parse(dataStr);
		if (msg.type === 'history') {
			msg.messages.forEach((m: { sender_id: number, content: string, timestamp: number }) => {
				appendDmMessage(chatContainer, {
					display_name: m.sender_id.toString() === userId ? display_name : targetName,
					content: m.content,
					timestamp: m.timestamp
				}, display_name);
			});
		} else if (msg.type === 'message') {
			if (msg.display_name === display_name) return;
			appendDmMessage(chatContainer, {
				display_name: msg.display_name,
				content: msg.content,
				timestamp: msg.timestamp
			}, display_name);
		}
	};

	ws.onerror = (err) => console.error('Direct Message WebSocket error', err)

	return ws;
}

export function sendDmMessage(
	ws: WebSocket,
	input: HTMLInputElement,
	chatContainer: HTMLDivElement,
	name: string
) {
	const content = input.value.trim();
	if (!content || ws.readyState !== WebSocket.OPEN) return;
	ws.send(JSON.stringify({ type: 'message', content }));
	appendDmMessage(chatContainer, {
		display_name: name,
		content,
		timestamp: Date.now()
	}, name);
	input.value = '';
}

export function appendDmMessage(
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

export async function setupDmChatControls(
	targetId: number,
	workArea: HTMLDivElement,
	menuArea: HTMLDivElement,
	dmCard: HTMLDivElement,
	chatContainer: HTMLDivElement,
	messageInput: HTMLInputElement,
	sendBtn: HTMLButtonElement,
	banner: HTMLDivElement,
	addFriendBtn: HTMLButtonElement,
	viewProfileBtn: HTMLButtonElement,
	inviteBtn: HTMLButtonElement,
	blockBtn: HTMLButtonElement
) {
	let friendPending = false
	let friendReceived = false
	let alreadyFriends = false
	let invitePending = false
	let isBlocked = false

	async function refreshFriendUI() {
		const { areFriends, requestSent, requestReceived } =
			await fetchFriendStatus(targetId)

		alreadyFriends = areFriends
		friendPending = requestSent
		friendReceived = requestReceived

		if (alreadyFriends) {
			addFriendBtn.classList.add('hidden')
		} else {
			addFriendBtn.classList.remove('hidden')
			if (friendPending)
				addFriendBtn.textContent = 'Cancel Request'
			else if (friendReceived)
				addFriendBtn.textContent = 'Accept Friend'
			else
				addFriendBtn.textContent = 'Add Friend'
		}
	}

	async function refreshInviteUI() {
		let sentData: unknown;

		const res = await fetch('/users/invite/sent', { credentials: 'include' });
		sentData = await res.json();
		const sent = Array.isArray(sentData) ? sentData : [];

		invitePending = sent.some((i: any) => i.friend_id === targetId);
		inviteBtn.textContent = invitePending ? 'Cancel Invite' : 'Invite to Game';
	}

	async function refreshBlockUI() {
		const res = await fetch(`/users/block/status/${targetId}`, { credentials: 'include' })
		const { blocked } = await res.json()
		isBlocked = blocked
		blockBtn.textContent = blocked ? 'Unblock User' : 'Block User'

		await updateBlockUI(targetId, dmCard, chatContainer, messageInput, sendBtn, banner)
	}

	addFriendBtn.addEventListener('click', async () => {
		addFriendBtn.disabled = true
		try {
			if (alreadyFriends) { }
			else if (friendPending) {
				const r = await fetch(`/users/friends/cancel/${targetId}`, { method: 'DELETE', credentials: 'include' })
				utils.showModal((await r.json()).message)
			}
			else if (friendReceived) {
				const r = await fetch(`/users/friends/accept/${targetId}`, { method: 'PUT', credentials: 'include' })
				utils.showModal((await r.json()).message)
			}
			else {
				const r = await fetch(`/users/friends/add/${targetId}`, { method: 'POST', credentials: 'include' })
				utils.showModal((await r.json()).message)
			}
		} finally {
			await refreshFriendUI()
			addFriendBtn.disabled = false
		}
	})

	inviteBtn.addEventListener('click', async () => {
		inviteBtn.disabled = true
		try {
			if (!invitePending) {
				const r = await fetch(`/users/invite/${targetId}`, { method: 'POST', credentials: 'include' })
				utils.showModal((await r.json()).message)
			} else {
				const r = await fetch(`/users/invite/cancel/${targetId}`, { method: 'DELETE', credentials: 'include' })
				utils.showModal((await r.json()).message)
			}
		} finally {
			await refreshInviteUI()
			inviteBtn.disabled = false
		}
	})

	blockBtn.addEventListener('click', async () => {
		blockBtn.disabled = true
		try {
			if (!isBlocked) {
				const r = await fetch(`/users/block/${targetId}`, { method: 'POST', credentials: 'include' })
				utils.showModal((await r.json()).message)
			} else {
				const r = await fetch(`/users/unblock/${targetId}`, { method: 'DELETE', credentials: 'include' })
				utils.showModal((await r.json()).message)
			}
		} finally {
			await Promise.all([
				refreshBlockUI(),
				refreshFriendUI(),
				refreshInviteUI()
			])
			blockBtn.disabled = false
		}
	})

	viewProfileBtn.addEventListener('click', () => {
		profile(workArea, menuArea, targetId.toString())
	})

	await Promise.all([
		refreshFriendUI(),
		refreshInviteUI(),
		refreshBlockUI()
	])
}