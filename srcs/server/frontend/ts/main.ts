import * as displayPage from './displayPage.js';
import * as utils from './utils.js';


async function resetPassword(token: string | null) {
	if (!token || token === '') {
		displayPage.notFound(workArea);
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
			displayPage.signIn(workArea, data?.error || 'Invalid token', true);
		}
		else {
			displayPage.resetPassword(workArea);
		}
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Reset failed! Catched on Try');
		let errorMessage = 'Invalid token';
		if (error) {
			errorMessage = 'Error: ' + error;
		}
		displayPage.signIn(workArea, errorMessage , true);
	}
}

async function render(path: string | null) {
	if (!path) {
		alert('No path to render!');
		throw new Error('No path to render!');
	}

	const isSgned = await utils.isSignedIn();
	switch (path) {
		case '/reset-password':
			if (isSgned) {
				displayPage.notFound(workArea);
			}
			else {
				const params = new URLSearchParams(window.location.search);
				const token = params.get('token');
				resetPassword(token);
			}
			break;
		case '/register':
			if (isSgned) {
				displayPage.notFound(workArea);
			}
			else {
				displayPage.signUp(workArea, menuArea);
			}
			break;
		case '/login':
			if (isSgned) {
				displayPage.notFound(workArea);
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
				displayPage.notFound(workArea);
			}
			break;
		case '/profile':
			if (isSgned) {
				const targetId = localStorage.getItem('lastTargetId')!;
				displayPage.profile(workArea, targetId);
			}
			else {
				displayPage.notFound(workArea);
			}
			break;
		case '/friends':
			if (isSgned) {
				displayPage.friendsList(workArea);
			}
			else {
				displayPage.notFound(workArea);
			}
			break;
		case '/chat-room':
			if (isSgned) {
				const userId = localStorage.getItem('userId')!;
				const displayName = localStorage.getItem('displayName')!;
				displayPage.chatPage(workArea, userId, displayName);
			}
			else {
				displayPage.notFound(workArea);
			}
			break;
		case '/play':
			if (isSgned) {
				displayPage.tournamentsPage(workArea);
			}
			else {
				displayPage.notFound(workArea);
			}
			break;
		case '/game':
			if (isSgned) {
				displayPage.tournamentsPage(workArea);
			}
			else {
				displayPage.notFound(workArea);
			}
			break;
		case '/':
			if (isSgned) {
				displayPage.dashboard(workArea);
			}
			else {
				displayPage.landingPage(workArea);
			}
			break;
		default:
			utils.addToHistory(path);
			displayPage.notFound(workArea);
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
