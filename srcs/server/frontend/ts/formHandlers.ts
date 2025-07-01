import * as utils from './utils.js';
import * as displayPage from './displayPage.js';
import * as buttonHandlers from './buttonHandlers.js';
import { globalSocket, initGlobalChat, onlineUsers } from './chatManager.js';
import { getUnreadMessages } from './utils.js';

export async function signUp(e: Event) {
	e.preventDefault();

	const workArea = (document.getElementById('appArea') as HTMLDivElement | null);

	const form = e.target as HTMLFormElement;
	const emailInput = document.getElementById('emailInput') as HTMLInputElement;
	const nameInput = document.getElementById('nameInput') as HTMLInputElement;
	const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;

	// Check whitespaces
	emailInput.setCustomValidity('');
	nameInput.setCustomValidity('');
	passwordInput.setCustomValidity('');

	if (utils.hasWhitespace(nameInput.value)) {
		nameInput.setCustomValidity('Display name cannot have whitespaces.');
		nameInput.reportValidity();
		return;
	}
	nameInput.setCustomValidity('');

	// check password length
	if (!passwordInput.checkValidity()) {
		alert("Password must be at least 6 characters long.");
		return;
	}

	if (utils.hasWhitespace(passwordInput.value)) {
		passwordInput.setCustomValidity('Password cannot have whitespaces.');
		passwordInput.reportValidity();
		return;
	}
	passwordInput.setCustomValidity('');

	const formData = new FormData(form);
	const email = formData.get('email');
	const display_name = formData.get('name');
	const password = formData.get('password');

	let messageDiv = document.getElementById('registerError') as HTMLDivElement | null;

	if (!messageDiv) {
		messageDiv = document.createElement('div');
		messageDiv.id = 'registerError';
		messageDiv.className = 'text-red-600 mt-2 text-sm';
		form.append(messageDiv);
	}

	try {
		const response = await fetch('/register', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email,
				display_name,
				password
			}),
		});

		const data = await response.json();
		console.log('API response:', data);
		if (!response.ok) {
			messageDiv.textContent = data?.error || 'Register failed';
			return;
		}
		const message = data?.success || 'Register success';
		emailInput.setCustomValidity('');
		displayPage.signIn(workArea, message);
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Register failed! Catched on Try');
	}
}

export async function signIn(e: Event) {
	e.preventDefault();

	const workArea = (document.getElementById('appArea') as HTMLDivElement | null);
	const menuArea = (document.getElementById('headerArea') as HTMLDivElement | null);

	const form = e.target as HTMLFormElement;
	const formData = new FormData(form);
	const email = formData.get('email');
	const password = formData.get('password');

	let messageDiv = document.getElementById('loginError') as HTMLDivElement | null;
	if (!messageDiv) {
		messageDiv = document.createElement('div');
		messageDiv.id = 'loginError';
		messageDiv.className = 'text-red-600 mt-2 text-sm';
		form.append(messageDiv);
	}

	try {
		const response = await fetch('/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email,
				password
			}),
			credentials: 'include'
		});

		const data = await response.json();
		console.log('API response:', data);
		if (!response.ok) {
			messageDiv.textContent = data?.error || 'Login failed.';
			return;
		}

		messageDiv.textContent = '';

		if (data.user) {
			if (data.user.id) {
				const userId = data.user.id;
				localStorage.setItem('userId', userId);
			}
			if (data.user.displayName) {
				const displayName = data.user.displayName;
				localStorage.setItem('displayName', displayName);
			}
			if (data.user.email) {
				const email = data.user.email;
				localStorage.setItem('email', email);
			}
		}
		let user2FA = '';
		if (data.twofa) {
			user2FA = data.twofa;
			localStorage.setItem('user2FA', user2FA);
		}

		if (user2FA === 'enabled') {
			displayPage.verify2FA(workArea);
		}
		else {
			initGlobalChat(localStorage.getItem('userId')!, localStorage.getItem('displayName')!);
			getUnreadMessages();
			displayPage.menu(menuArea, workArea);
			displayPage.dashboard(workArea);
			buttonHandlers.initThemeToggle();

			document.getElementById('signOutButton')?.addEventListener("click", () => buttonHandlers.signOut(workArea));
			document.getElementById('dashboardButton')?.addEventListener("click", () => displayPage.dashboard(workArea));
			document.getElementById('accountSettingsButton')?.addEventListener("click", () => buttonHandlers.accountSettings(workArea));

			document.getElementById('chatButton')?.addEventListener("click", () => buttonHandlers.chatPage(workArea, localStorage.getItem('userId')!, localStorage.getItem('displayName')!));
		}
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Login failed! Catched on Try');
	}
}

export async function verify2FA(e: Event) {
	e.preventDefault();

	const workArea = (document.getElementById('appArea') as HTMLDivElement | null);
	const menuArea = (document.getElementById('headerArea') as HTMLDivElement | null);

	const form = e.target as HTMLFormElement;
	const formData = new FormData(form);
	const email = localStorage.getItem('email');
	const otp = formData.get('code');
	try {
		const response = await fetch('/verify-2fa', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email,
				otp
			}),
			credentials: 'include'
		});

		const data = await response.json();
		console.log('API response:', data);
		if (!response.ok) {
			const message = data?.error || 'Login failed.';
			console.error('Error verifying 2FA: ', message);
			const errorMessage = form.querySelector('#verifyError') as HTMLSpanElement | null;
			if (errorMessage) {
				errorMessage.textContent = message;
			}
			return;
		}
		initGlobalChat(localStorage.getItem('userId')!, localStorage.getItem('displayName')!);
		getUnreadMessages();
		displayPage.menu(menuArea, workArea);
		displayPage.dashboard(workArea);
		buttonHandlers.initThemeToggle();

		document.getElementById('signOutButton')?.addEventListener("click", () => buttonHandlers.signOut(workArea));
		document.getElementById('dashboardButton')?.addEventListener("click", () => displayPage.dashboard(workArea));
		document.getElementById('accountSettingsButton')?.addEventListener("click", () => buttonHandlers.accountSettings(workArea));
		document.getElementById('chatButton')?.addEventListener("click", () => buttonHandlers.chatPage(workArea, localStorage.getItem('userId')!, localStorage.getItem('displayName')!));
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Login failed! Catched on Try');
	}
}

export async function changeDisplayName(e: Event) {
	e.preventDefault();

	const workArea = (document.getElementById('appArea') as HTMLDivElement | null);
	const menuArea = (document.getElementById('headerArea') as HTMLDivElement | null);
	const form = e.target as HTMLFormElement;
	const formData = new FormData(form);
	const display_name = formData.get('name');
	const userId = localStorage.getItem('userId');

	let messageDiv = document.getElementById('loginError') as HTMLDivElement | null;
	if (!messageDiv) {
		messageDiv = document.createElement('div');
		messageDiv.id = 'loginError';
		messageDiv.className = 'text-red-600 mt-2 text-sm';
		form.append(messageDiv);
	}

	try {
		const response = await fetch(`/users/${userId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ display_name }),
			credentials: 'include'
		})

		const data = await response.json();
		if (!response.ok) {
			messageDiv.textContent = data?.message || 'Error changing display name';
			return;
		}
		onlineUsers.delete(localStorage.getItem('displayName')!);
		localStorage.setItem('displayName', display_name?.toString()!)
		onlineUsers.add(localStorage.getItem('displayName')!)
		window.dispatchEvent(new CustomEvent('global-presence-updated'));
		if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
 			globalSocket.send(JSON.stringify({
    			type: 'identify',
    			userId: localStorage.getItem('userId'),
				display_name: localStorage.getItem('displayName')
  			}));
		}
		window.dispatchEvent(new CustomEvent('global-presence-updated'));
		messageDiv.textContent = '';
		utils.showModal('Display name changed successfully!');
		displayPage.menu(menuArea, workArea);
		displayPage.dashboard(workArea);
		document.getElementById('signOutButton')?.addEventListener("click", () => buttonHandlers.signOut(workArea));
		document.getElementById('dashboardButton')?.addEventListener("click", () => displayPage.dashboard(workArea));
		document.getElementById('accountSettingsButton')?.addEventListener("click", () => buttonHandlers.accountSettings(workArea));
		document.getElementById('chatButton')?.addEventListener("click", () => buttonHandlers.chatPage(workArea, localStorage.getItem('userId')!, localStorage.getItem('displayName')!));
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Failed changing display name');
	}
}

export async function changePassword(e: Event) {
	e.preventDefault();

	const workArea = (document.getElementById('appArea') as HTMLDivElement | null);
	const menuArea = (document.getElementById('headerArea') as HTMLDivElement | null);
	const form = e.target as HTMLFormElement;
	const formData = new FormData(form);
	const oldPassword = formData.get('oldPassword');
	const newPassword = formData.get('newPassword');
	const confirmPassword = formData.get('confirmPassword');
	const userId = localStorage.getItem('userId');

	let messageDiv = document.getElementById('changeDetailsError') as HTMLDivElement | null;

	if (!messageDiv) {
		messageDiv = document.createElement('div');
		messageDiv.id = 'changeDetailsError';
		messageDiv.className = 'text-red-600 mt-2 text-sm';
		form.append(messageDiv);
	}

	try {
		const response = await fetch(`/users/${userId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
			credentials: 'include'
		});

		const data = await response.json();
		if (!response.ok) {
			messageDiv.textContent = data?.message || 'Error changing details';
			return;
		}

		messageDiv.textContent = '';
		utils.showModal('Password changed successfully!');
		displayPage.menu(menuArea, workArea);
		displayPage.dashboard(workArea);
		document.getElementById('signOutButton')?.addEventListener("click", () => buttonHandlers.signOut(workArea));
		document.getElementById('dashboardButton')?.addEventListener("click", () => displayPage.dashboard(workArea));
		document.getElementById('accountSettingsButton')?.addEventListener("click", () => buttonHandlers.accountSettings(workArea));
		document.getElementById('chatButton')?.addEventListener("click", () => buttonHandlers.chatPage(workArea, localStorage.getItem('userId')!, localStorage.getItem('displayName')!));
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Failed changing password');
	}
}