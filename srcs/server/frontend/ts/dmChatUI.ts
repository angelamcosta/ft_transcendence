export function buildDmCard(targetName: string) {
	const wrapper = document.createElement('div');
	wrapper.classList.add(
		'relative',
		'flex',
		'justify-center',
		'items-center',
		'p-6'
	);

	const dmCard = document.createElement('div');
	dmCard.classList.add(
		'w-[480px]',
		'max-w-[90vw]',
		'h-[500px]',
		'card'
	);

	const title = document.createElement('div');
	title.textContent = targetName;
	title.classList.add(
		'px-4',
		'py-3',
		'border-b',
		'border-gray-300',
		'font-bold',
		'bg-gray-50'
	);

	dmCard.append(title);
	wrapper.append(dmCard);
	return { wrapper, dmCard };
}

export function buildControls(
	addFriendBtn: HTMLButtonElement,
	viewProfileBtn: HTMLButtonElement,
	inviteBtn: HTMLButtonElement,
	blockBtn: HTMLButtonElement
) {
	const ctr = document.createElement('div');
	ctr.classList.add(
		'flex',
		'flex-nowrap',
		'gap-1.5',
		'py-2',
		'px-4',
		'justify-center',
		'w-full',
		'mx-auto'
	);

	ctr.append(addFriendBtn, viewProfileBtn, inviteBtn, blockBtn);
	return ctr;
}

export function buildDMChatContainer() {
	const c = document.createElement('div');
	c.classList.add(
		'flex-1',
		'p-2',
		'overflow-y-auto',
		'break-words',
    	'whitespace-pre-wrap'
	);
	return c;
}

export function buildDMInputWrapper(sendBtn: HTMLButtonElement, messageInput: HTMLInputElement) {
	const w = document.createElement('div');
	w.classList.add(
		'flex',
		'border-t',
		'border-gray-200',
		'p-2'
	);
	w.append(messageInput, sendBtn);
	return w;
}

export function buildDmUI(targetName: string) {
	const { wrapper, dmCard } = buildDmCard(targetName)

	const banner = document.createElement('div');
	banner.classList.add(
		'py-2',
		'text-center',
		'italic'
	);

	const chatContainer = buildDMChatContainer();

	const messageInput = document.createElement('input');
	messageInput.placeholder = 'Type a message…';
	messageInput.classList.add(
		'flex-1',
		'p-1',
		'px-2',
		'border',
		'border-gray-300',
		'rounded-sm'
	);

	const sendBtn = document.createElement('button');
	sendBtn.textContent = 'Send';
	sendBtn.classList.add(
		'ml-2',
		'py-1',
		'px-3',
		'border',
		'border-blue-500',
		'bg-blue-500',
		'text-white',
		'rounded',
		'cursor-pointer'
	);

	const inputWrapper = buildDMInputWrapper(sendBtn, messageInput);

	const makeBtn = (text: string, color: string) => {
		const b = document.createElement('button');
		b.textContent = text;
		b.className = [
			`bg-${color}-500`,
			`border-${color}-500`,
			'text-white',
			'px-3',
			'py-1',
			'rounded',
			'text-sm',
			'whitespace-nowrap',
			'flex-none',
			'cursor-pointer'
		].join(' ');
		return b;
	};

	const addFriendBtn = makeBtn('Add Friend', 'green')
	const viewProfileBtn = makeBtn('View Profile', 'sky')
	const inviteBtn = makeBtn('Invite to Game', 'blue')
	const blockBtn = makeBtn('Block User', 'red')

	const controls = buildControls(addFriendBtn, viewProfileBtn, inviteBtn, blockBtn)

	dmCard.append(controls, banner, chatContainer, inputWrapper)
	wrapper.append(dmCard)

	return {
		wrapper,
		banner,
		chatContainer,
		messageInput,
		sendBtn,
		addFriendBtn,
		viewProfileBtn,
		inviteBtn,
		blockBtn
	}
}
