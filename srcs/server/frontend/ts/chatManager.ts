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

export function buildDmCard(targetName: string, headerArea: HTMLDivElement) {
	const wrapper = document.createElement('div');
	Object.assign(wrapper.style, {
		position: 'relative',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		height: `calc(85vh - ${headerArea.offsetHeight}px)`,
	});

	const dmCard = document.createElement('div');
	Object.assign(dmCard.style, {
		width: '400px',
		maxWidth: '90vw',
		height: '500px',
		background: '#fff',
		border: '1px solid #ccc',
		borderRadius: '8px',
		boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden',
	});

	const title = document.createElement('div');
	title.textContent = targetName;
	Object.assign(title.style, {
		padding: '12px 16px',
		borderBottom: '1px solid #eee',
		fontWeight: 'bold',
		background: '#f7f7f7',
	});

	wrapper.append(dmCard);
	dmCard.append(title);
	return { wrapper, dmCard };
}

export function buildControls(
	onAddFriend: () => void,
	onViewProfile: () => void,
	inviteBtn: HTMLButtonElement,
	blockBtn: HTMLButtonElement
) {
	const ctr = document.createElement('div');
	Object.assign(ctr.style, {
		display: 'flex',
		gap: '8px',
		padding: '2px 3px',
		width: 'fit-content',
		margin: '0 auto',
	});

	const make = (text: string, color: string) => {
		const b = document.createElement('button');
		b.textContent = text;
		Object.assign(b.style, {
			background: color,
			color: '#fff',
			border: `1px solid ${color}`,
			padding: '2px 3px',
			fontSize: '0.875rem',
			borderRadius: '4px',
			cursor: 'pointer',
		});
		return b;
	};

	const addFriendBtn = make('Add Friend', '#28a745');
	const viewProfileBtn = make('View Profile', '#17a2b8');

	addFriendBtn.addEventListener('click', onAddFriend);
	viewProfileBtn.addEventListener('click', onViewProfile);

	ctr.append(addFriendBtn, viewProfileBtn, inviteBtn, blockBtn);
	return ctr;
}

export function buildDMChatContainer() {
	const c = document.createElement('div');
	Object.assign(c.style, {
		flex: '1 1 auto',
		padding: '8px',
		overflowY: 'auto',
	});
	return c;
}

export function buildDMInputWrapper(sendBtn: HTMLButtonElement, messageInput: HTMLInputElement) {
	const w = document.createElement('div');
	Object.assign(w.style, {
		display: 'flex',
		borderTop: '1px solid #eee',
		padding: '8px',
	});
	w.append(messageInput, sendBtn);
	return w;
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
		banner.textContent = 'You have blocked this user.';
	else if (blockedByTarget)
		banner.textContent = 'You have been blocked by this user.';

	if (blockedByMe || blockedByTarget) {
		if (!banner.isConnected)
			dmCard.insertBefore(banner, chatContainer);
	} else {
		if (banner.isConnected)
			banner.remove();
	}
	const disabled = blockedByMe || blockedByTarget;
	chatContainer.style.opacity = disabled ? '0.5' : '1';
	messageInput.disabled = disabled;
	sendBtn.disabled = disabled;
}

export function buildGlobalWrapper(headerArea: HTMLDivElement) {
	const wrapper = document.createElement('div');
	Object.assign(wrapper.style, {
		position: 'relative',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		height: `calc(85vh - ${headerArea.offsetHeight}px)`
	});
	return wrapper;
}

export function buildGlobalChatCard() {
	const chatCard = document.createElement('div');
	Object.assign(chatCard.style, {
		width: '400px',
		maxWidth: '90vw',
		height: '500px',
		background: '#fff',
		border: '1px solid #ccc',
		borderRadius: '8px',
		boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden'
	});

	const chatContainer = document.createElement('div');
	Object.assign(chatContainer.style, {
		flex: '1 1 auto',
		padding: '8px',
		overflowY: 'auto'
	});

	const inputWrapper = document.createElement('div');
	Object.assign(inputWrapper.style, {
		display: 'flex',
		borderTop: '1px solid #eee',
		padding: '8px'
	});

	const messageInput = document.createElement('input');
	messageInput.placeholder = 'Type a message…';
	Object.assign(messageInput.style, {
		flex: '1 1 auto',
		padding: '4px 8px',
		border: '1px solid #ccc',
		borderRadius: '4px'
	});

	const sendBtn = document.createElement('button');
	sendBtn.textContent = 'Send';
	Object.assign(sendBtn.style, {
		marginLeft: '8px',
		padding: '4px 12px',
		border: '1px solid #007bff',
		background: '#007bff',
		color: '#fff',
		borderRadius: '4px',
		cursor: 'pointer'
	});

	inputWrapper.append(messageInput, sendBtn);
	chatCard.append(chatContainer, inputWrapper);

	return { chatCard, chatContainer, messageInput, sendBtn };
}

export function buildUserListPanel() {
	const userListCard = document.createElement('div');
	Object.assign(userListCard.style, {
		width: '200px',
		height: '500px',
		background: '#fafafa',
		border: '1px solid #ccc',
		borderRadius: '8px',
		boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden',
		marginLeft: '16px'
	});

	const userListHeader = document.createElement('div');
	userListHeader.textContent = 'Users';
	Object.assign(userListHeader.style, {
		padding: '8px',
		borderBottom: '1px solid #eee',
		fontWeight: 'bold',
		textAlign: 'center'
	});

	const userListContainer = document.createElement('div');
	Object.assign(userListContainer.style, {
		flex: '1 1 auto',
		padding: '8px',
		overflowY: 'auto'
	});

	userListCard.append(userListHeader, userListContainer);
	return { userListCard, userListContainer };
}