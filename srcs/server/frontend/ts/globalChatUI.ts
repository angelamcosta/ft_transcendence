import * as utils from './utils.js'

export function buildGlobalWrapper() {
	const wrapper = document.createElement('div');
	wrapper.classList.add(
		'relative',
		'flex',
		'justify-center',
		'items-center',
		'p-6'
	);
	return wrapper;
}

export function buildGlobalChatCard() {
	const chatCard = document.createElement('div');
	chatCard.classList.add(
		'card',
		'w-[480px]',
		'max-w-[90vw]',
		'h-[500px]'
	);

	const chatContainer = document.createElement('div');
	chatContainer.classList.add(
		'flex-1',
		'p-2',
		'overflow-y-auto'
	)

	const inputWrapper = document.createElement('div');
	inputWrapper.classList.add(
		'flex',
		'border-t',
		'border-gray-200',
		'p-2'
	);

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
		'rounded-sm',
		'cursor-pointer'
	);

	inputWrapper.append(messageInput, sendBtn);
	chatCard.append(chatContainer, inputWrapper);

	return { chatCard, chatContainer, messageInput, sendBtn };
}

export function buildUserListPanel() {
	const userListCard = document.createElement('div');
	userListCard.classList.add(
		'card',
		'w-[200px]',
		'h-[500px]',
		'bg-gray-50',
		'ml-4'
	);

	const userListHeader = document.createElement('div');
	userListHeader.textContent = 'Users';
	userListHeader.classList.add(
		'p-2',
		'border-b',
		'border-gray-200',
		'font-bold',
		'text-center'
	);

	const userListContainer = document.createElement('div');
	userListContainer.classList.add(
		'flex-1',
		'p-2',
		'overflow-y-auto'
	);

	userListCard.append(userListHeader, userListContainer);
	return { userListCard, userListContainer };
}

export function buildChatUI(
	workArea: HTMLDivElement,
): {
	userListContainer: HTMLDivElement;
	chatContainer: HTMLDivElement;
	messageInput: HTMLInputElement;
	sendBtn: HTMLButtonElement;
} {
	utils.cleanDiv(workArea);
	const wrapper = buildGlobalWrapper();
	const { chatCard, chatContainer, messageInput, sendBtn } = buildGlobalChatCard();
	const { userListCard, userListContainer } = buildUserListPanel();
	wrapper.append(chatCard, userListCard);
	workArea.appendChild(wrapper);
	return { userListContainer, chatContainer, messageInput, sendBtn };
}
