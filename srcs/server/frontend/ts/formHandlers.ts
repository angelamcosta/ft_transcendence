import * as utils from './utils.js';
import * as displayPage from './displayPage.js';
import { globalSocket, onlineUsers } from './globalChatManager.js';

export async function signUp(e: Event) {
	e.preventDefault();

	const workArea = (document.getElementById('appArea') as HTMLDivElement | null);

	const form = e.target as HTMLFormElement;
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
		if (!response.ok) {
			messageDiv.textContent = data?.error || 'Register failed';
			return;
		}
		const message = data?.success || 'Register success';
		displayPage.signIn(workArea, message);
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Register failed! Catched on Try');
	}
}

export async function signIn(e: Event) {
	e.preventDefault();

	const workArea = (document.getElementById('appArea') as HTMLDivElement | null);

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
			displayPage.dashboard(workArea);
		}
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Login failed! Catched on Try');
	}
}

export async function sendLink(e: Event) {
	e.preventDefault();

	const form = e.target as HTMLFormElement;
	const formData = new FormData(form);
	const email = formData.get('resetEmail');
	const workArea = (document.getElementById('appArea') as HTMLDivElement | null);
	const loginForm = (document.getElementById('login') as HTMLFormElement | null);
	const resetButton = (document.getElementById('resetButton') as HTMLButtonElement | null);

	let messageDiv = document.getElementById('sendLinkError') as HTMLDivElement | null;
	if (messageDiv) {
		form.removeChild(messageDiv);
	}
	
	let successDiv = document.getElementById('successMessage') as HTMLDivElement | null;
	try {
		const response = await fetch('/send-link', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email
			}),
			credentials: 'include'
		});

		const data = await response.json();
		if (!response.ok) {
			messageDiv = document.createElement('div');
			messageDiv.id = 'sendLinkError';
			messageDiv.className = 'text-red-600 mt-2 text-sm';
			messageDiv.textContent = data?.error || 'Something went wrong. Please try again later.';
			form.append(messageDiv);
			return;
		}
		if (!successDiv) {
			successDiv = document.createElement('div');
			successDiv.id = 'successMessage';
			loginForm?.append(successDiv);
		}
		resetButton?.classList.add("hidden");
		successDiv.className = 'text-green-600 mt-4 text-sm text-center';
		successDiv.textContent = data?.success || 'If an account with that email exists, we’ve sent a reset link.';
		workArea?.removeChild(form);
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Send link failed! Catched on Try');
	}
}

export async function resetPassword(e: Event) {
	e.preventDefault();

	const workArea = (document.getElementById('appArea') as HTMLDivElement | null);
	const form = e.target as HTMLFormElement;
	const formData = new FormData(form);
	const newPassword = formData.get('newPassword');
	const confirmPassword = formData.get('confirmPassword');
	const params = new URLSearchParams(window.location.search);
  	const token = params.get('token');
	
	let messageDiv = document.getElementById('changeDetailsError') as HTMLDivElement | null;
	if (!messageDiv) {
		messageDiv = document.createElement('div');
		messageDiv.id = 'changeDetailsError';
		messageDiv.className = 'text-red-600 mt-2 text-sm';
		form.append(messageDiv);
	}

	try {
		const response = await fetch(`/reset-password`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ token, newPassword, confirmPassword }),
			credentials: 'include'
		});

		const data = await response.json();
		if (!response.ok) {
			messageDiv.textContent = data?.error || 'Error reset password';
			return;
		}
		const message = data?.success || 'Success on password reset';
		displayPage.signIn(workArea, message);
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Failed reseting password');
	}
}

export async function verify2FA(e: Event) {
	e.preventDefault();

	const workArea = (document.getElementById('appArea') as HTMLDivElement | null);

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
		if (!response.ok) {
			const message = data?.error || 'Login failed.';
			console.error('Error verifying 2FA: ', message);
			const errorMessage = form.querySelector('#verifyError') as HTMLSpanElement | null;
			if (errorMessage) {
				errorMessage.textContent = message;
			}
			return;
		}
		displayPage.dashboard(workArea);
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Login failed! Catched on Try');
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
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Failed changing password');
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
		onlineUsers.delete(localStorage.getItem('display_name')!);
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
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Failed changing display name');
	}
}
