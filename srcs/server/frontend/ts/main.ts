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
			return false;
		}
		else {
			return true;
		}
	} catch (error) {
		console.error('Error sending form data:', error);
		return false;
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

async function render(path: string | null) {
	if (!path) {
		alert('No path to render!');
		throw new Error('No path to render!');
	}

	const isSgned = await isSignedIn();
	switch (path) {
		case '/reset-password':
			if (isSgned) {
				history.replaceState({ path: "/dashboard" }, "", "/dashboard");
				getUnreadMessages();
				const userId = localStorage.getItem('userId')!;
				const displayName = localStorage.getItem('displayName')!;
				initGlobalChat(userId, displayName);
				initAppNav(menuArea, workArea);
				buttonHandlers.initThemeToggle();
			}
			else {
				const params = new URLSearchParams(window.location.search);
				const token = params.get('token');
				resetPassword(token);
			}
			break;
			case '/register':
			if (isSgned) {
				history.replaceState({ path: "/dashboard" }, "", "/dashboard");
				getUnreadMessages();
				const userId = localStorage.getItem('userId')!;
				const displayName = localStorage.getItem('displayName')!;
				initGlobalChat(userId, displayName);
				initAppNav(menuArea, workArea);
				buttonHandlers.initThemeToggle();
			}
			else {
				displayPage.signUp(workArea, menuArea);
			}
			break;
			case '/login':
			if (isSgned) {
				history.replaceState({ path: "/dashboard" }, "", "/dashboard");
				getUnreadMessages();
				const userId = localStorage.getItem('userId')!;
				const displayName = localStorage.getItem('displayName')!;
				initGlobalChat(userId, displayName);
				initAppNav(menuArea, workArea);
				buttonHandlers.initThemeToggle();
			}
			else {
				displayPage.signIn(workArea);
			}
			break;
			case '/settings':
			if (isSgned) {
				displayPage.accountSettings(workArea);
			}
			else {
				history.replaceState({ path: "/" }, "", "/");
				displayPage.header(menuArea);
				displayPage.landingPage(workArea, menuArea);
				buttonHandlers.initThemeToggle();
				document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
				document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
				document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
			}
			break;
			case '/profile':
			if (isSgned) {
				const targetId = localStorage.getItem('lastTargetId')!;
				displayPage.profile(workArea, targetId);
			}
			else {
				history.replaceState({ path: "/" }, "", "/");
				displayPage.header(menuArea);
				displayPage.landingPage(workArea, menuArea);
				buttonHandlers.initThemeToggle();
				document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
				document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
				document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
			}
			break;
			case '/friends':
			if (isSgned) {
				displayPage.friendsList(workArea);
			}
			else {
				history.replaceState({ path: "/" }, "", "/");
				displayPage.header(menuArea);
				displayPage.landingPage(workArea, menuArea);
				buttonHandlers.initThemeToggle();
				document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
				document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
				document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
			}
			break;
			case '/chat':
			if (isSgned) {
				const userId = localStorage.getItem('userId')!;
				const displayName = localStorage.getItem('displayName')!;
				displayPage.chatPage(workArea, userId, displayName);
			}
			else {
				history.replaceState({ path: "/" }, "", "/");
				displayPage.header(menuArea);
				displayPage.landingPage(workArea, menuArea);
				buttonHandlers.initThemeToggle();
				document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
				document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
				document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
			}
			break;
			case '/tournaments':
			if (isSgned) {
				displayPage.tournamentsPage(workArea);
			}
			else {
				history.replaceState({ path: "/" }, "", "/");
				displayPage.header(menuArea);
				displayPage.landingPage(workArea, menuArea);
				buttonHandlers.initThemeToggle();
				document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
				document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
				document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
			}
			break;
			case '/play':
			if (isSgned) {
				displayPage.gamePage(workArea);
			}
			else {
				history.replaceState({ path: "/" }, "", "/");
				displayPage.header(menuArea);
				displayPage.landingPage(workArea, menuArea);
				buttonHandlers.initThemeToggle();
				document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
				document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
				document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
			}
			break;
		default:
			if (isSgned) {
				getUnreadMessages();
				const userId = localStorage.getItem('userId')!;
				const displayName = localStorage.getItem('displayName')!;
				initGlobalChat(userId, displayName);
				initAppNav(menuArea, workArea);
				buttonHandlers.initThemeToggle();
			}
			else {
				displayPage.header(menuArea);
				displayPage.landingPage(workArea, menuArea);
				buttonHandlers.initThemeToggle();
				document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
				document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
				document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
			}
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

window.addEventListener("popstate", (e) => {
  const path = e.state?.path || location.pathname;
  render(path);
});

const path = window.location.pathname;
render(path);
