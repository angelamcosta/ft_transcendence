import * as displayPage from './displayPage.js';
import * as buttonHandlers from './buttonHandlers.js';
import { initGlobalChat } from './globalChatManager.js';
import { initAppNav } from './utils.js';
import { getUnreadMessages } from './globalChatManager.js';

async function isSignedIn() {
	try {
		const response = await fetch('/verify', {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			},
			credentials: 'include'
		});

		if (!response.ok) {
			displayPage.header(menuArea);
			displayPage.landingPage(workArea, menuArea);
			buttonHandlers.initThemeToggle();
			document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
			document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
			document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
		}
		else {
			getUnreadMessages();
			const userId = localStorage.getItem('userId')!;
			const displayName = localStorage.getItem('displayName')!;
			initGlobalChat(userId, displayName);
			initAppNav(menuArea, workArea);
			buttonHandlers.initThemeToggle();
		}
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Verify failed! Catched on Try');
		displayPage.header(menuArea);
		displayPage.landingPage(workArea, menuArea);
		buttonHandlers.initThemeToggle();
		document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
		document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
		document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
	}
}

async function resetPassword(token: string | null) {
	if (!token) {
		return;
	}

	try {
		const response = await fetch('/verify-reset-token', {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'token': token
			},
			credentials: 'include'
		});

		const data = await response.json();
		if (!response.ok) {
			displayPage.header(menuArea);
			displayPage.signIn(workArea, data?.error || 'Invalid token', true);
			buttonHandlers.initThemeToggle();
			document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
			document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
			document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
		}
		else {
			displayPage.header(menuArea);
			displayPage.resetPassword(workArea);
			buttonHandlers.initThemeToggle();
			document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
			document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
			document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
		}
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Verify failed! Catched on Try');
		displayPage.header(menuArea);
		let errorMessage = 'Invalid token';
		if (error) {
			errorMessage = 'Error: ' + error;
		}
		displayPage.signIn(workArea, errorMessage , true);
		buttonHandlers.initThemeToggle();
		document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
		document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
		document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
	}
}

const workArea = (document.getElementById('appArea') as HTMLDivElement | null);
const menuArea = (document.getElementById('headerArea') as HTMLDivElement | null);

if (!workArea) {
	alert('No working div!');
	throw new Error('No working div!');
}

if (!menuArea) {
	alert('No menu div!');
	throw new Error('No menu div!');
}

const path = window.location.pathname;
switch (path) {
	case '/':
    	isSignedIn();
    	break;
    case '/reset-password':
		const params = new URLSearchParams(window.location.search);
  		const token = params.get('token');
    	resetPassword(token);
    	break;
	default:
    	isSignedIn();
  }
