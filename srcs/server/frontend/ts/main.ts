import * as displayPage from './displayPage.js';
import * as utils from './utils.js';


async function resetPassword(token: string | null) {
	if (!token || token === '') {
		displayPage.notFound(workArea, menuArea);
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
			displayPage.signIn(workArea, menuArea, data?.error || 'Invalid token', true);
		}
		else {
			displayPage.resetPassword(workArea, menuArea);
		}
	} catch (error) {
		console.error('Error sending form data:', error);
		alert('Reset failed! Catched on Try');
		let errorMessage = 'Invalid token';
		if (error) {
			errorMessage = 'Error: ' + error;
		}
		displayPage.signIn(workArea, menuArea, errorMessage , true);
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
				displayPage.notFound(workArea, menuArea);
			}
			else {
				const params = new URLSearchParams(window.location.search);
				const token = params.get('token');
				resetPassword(token);
			}
			break;
		case '/register':
			if (isSgned) {
				displayPage.notFound(workArea, menuArea);
			}
			else {
				displayPage.signUp(workArea, menuArea);
			}
			break;
		case '/login':
			if (isSgned) {
				displayPage.notFound(workArea, menuArea);
			}
			else {
				displayPage.signIn(workArea,menuArea);
			}
			break;
		case '/settings':
			if (isSgned) {
				displayPage.accountSettings(workArea, menuArea);
			}
			else {
				displayPage.notFound(workArea, menuArea);
			}
			break;
		case '/profile':
			if (isSgned) {
				const targetId = localStorage.getItem('lastTargetId')!;
				displayPage.profile(workArea, menuArea, targetId);
			}
			else {
				displayPage.notFound(workArea, menuArea);
			}
			break;
		case '/friends':
			if (isSgned) {
				displayPage.friendsList(workArea, menuArea);
			}
			else {
				displayPage.notFound(workArea, menuArea);
			}
			break;
		case '/chat-room':
			if (isSgned) {
				const userId = localStorage.getItem('userId')!;
				const displayName = localStorage.getItem('displayName')!;
				displayPage.chatPage(workArea, menuArea, userId, displayName);
			}
			else {
				displayPage.notFound(workArea, menuArea);
			}
			break;
		case '/play':
			if (isSgned) {
				displayPage.tournamentsPage(workArea, menuArea);
			}
			else {
				displayPage.notFound(workArea, menuArea);
			}
			break;
		case '/':
			if (isSgned) {
				displayPage.dashboard(workArea, menuArea);
			}
			else {
				displayPage.landingPage(workArea, menuArea);
			}
			break;
		default:
			utils.addToHistory(path);
			displayPage.notFound(workArea, menuArea);
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
