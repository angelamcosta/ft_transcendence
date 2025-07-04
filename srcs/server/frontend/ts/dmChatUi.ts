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
		width: '420px',
		maxWidth: '90vw',
		height: '500px',
		background: '#fff',
		border: '1px solid #ccc',
		borderRadius: '12px',
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
	addFriendBtn: HTMLButtonElement,
	viewProfileBtn: HTMLButtonElement,
	inviteBtn: HTMLButtonElement,
	blockBtn: HTMLButtonElement
) {
	const ctr = document.createElement('div');
	Object.assign(ctr.style, {
		display: 'flex',
		gap: '6px',
		justifyContent: 'center',
		padding: '8px 0',
		width: 'fit-content',
		margin: '0 auto',
	});

	const all = [addFriendBtn, viewProfileBtn, inviteBtn, blockBtn]
	all.forEach(b => {
		Object.assign(b.style, {
			flex: '0 0 auto',
			whiteSpace: 'nowrap',
			textAlign: 'center',
			minWidth: '90px',
		})
	})

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