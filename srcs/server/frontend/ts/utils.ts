import * as displayPage from './displayPage.js'
import * as buttonHandlers from './buttonHandlers.js'
import { getUnreadMessages } from './globalChatManager.js';
import { initGlobalChat } from './globalChatManager.js';

export interface User {
	id: number;
	display_name: string;
}

export interface Tournaments {
	id: number;
	name: string;
	status: string;
	capacity: number;
	created_by: string;
	current_capacity: number;
}

export interface TournamentMatch {
	id: number;
	player1_id: number;
	player2_id: number;
	player1: string;
	player2: string;
	status: string;
	score: string | null;
	round: number;
}

export async function isSignedIn() {
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

export function initAppNav() {
	const workArea = (document.getElementById('appArea') as HTMLDivElement | null);
	const menuArea = (document.getElementById('headerArea') as HTMLDivElement | null);

	if (!workArea || !menuArea)
		return;

	const menu = menuArea?.querySelector('#menu') as HTMLDivElement | null;
	if (menu)
		return;

	displayPage.menu(menuArea);
	getUnreadMessages();
	const userId = localStorage.getItem('userId')!;
	const displayName = localStorage.getItem('displayName')!;
	initGlobalChat(userId, displayName);
	document.getElementById('signOutButton')?.addEventListener("click", () => buttonHandlers.signOut(workArea));
	document.getElementById('dashboardButton')?.addEventListener("click", () => displayPage.dashboard(workArea));
	document.getElementById('accountSettingsButton')?.addEventListener("click", () => buttonHandlers.accountSettings(workArea));
	document.getElementById('chatButton')?.addEventListener("click", () => buttonHandlers.chatPage(workArea, userId, displayName));
	document.getElementById('playButton')?.addEventListener("click", () => buttonHandlers.tournamentsPageHandler(workArea));
	document.getElementById('profileButton')?.addEventListener("click", () => buttonHandlers.profile(workArea));
	document.getElementById('friendsButton')?.addEventListener("click", () => buttonHandlers.friendsList(workArea));
	buttonHandlers.initThemeToggle();
}

export function initAppHeader() {
	const workArea = (document.getElementById('appArea') as HTMLDivElement | null);
	const menuArea = (document.getElementById('headerArea') as HTMLDivElement | null);

	if (!workArea || !menuArea)
		return;

	const header = menuArea?.querySelector('#header') as HTMLDivElement | null;
	if (header)
		return;

	displayPage.header(menuArea);
	buttonHandlers.initThemeToggle();
	document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea));
	document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
	document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
}

export const eyeIcon = `
		<svg class="w-5 h-5 fill-blue-500 hover:fill-blue-700" xmlns="http://www.w3.org/2000/svg" 
       		viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
       		stroke-linecap="round" stroke-linejoin="round">
    	<path d="M2.062 12.348a1 1 0 0 1 0-.696 
             10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 
             10.75 10.75 0 0 1-19.876 0"/>
    	<circle cx="12" cy="12" r="3"/>
  		</svg>`;

export const eyeSlashIcon = `
  		<svg class="w-5 h-5 fill-blue-500 hover:fill-blue-700" xmlns="http://www.w3.org/2000/svg"
       		viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
       		stroke-linecap="round" stroke-linejoin="round">
    	<path d="M17.94 17.94A10.5 10.5 0 0 1 3 12c1.3-2.5 3.87-4.5 7-5"/>
    	<path d="M1 1l22 22"/>
  		</svg>`;

export function cleanDiv(divArea: HTMLDivElement | null) {
	if (typeof (window as any).stopGame === 'function') {
		(window as any).stopGame();
	}
	divArea?.replaceChildren();
}

export function cleanLocalStorage() {
	localStorage.removeItem('userId');
	localStorage.removeItem('displayName');
	localStorage.removeItem('email');
	localStorage.removeItem('user2FA');
	localStorage.removeItem('lastTargetId');
}

export function hasWhitespace(input: string): boolean {
	return /\s/.test(input);
}

export async function getUsers(): Promise<User[]> {
	try {
		const res = await fetch('/users', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include'
		});
		if (res.ok) {
			const users: User[] = await res.json();
			return users;
		} else
			console.error('Failed to load users list', await res.text());
	} catch (err) {
		console.error('Error fetching users', err);
		return [];
	}
	return [];
}

export async function getTournaments(): Promise<Tournaments[]> {
	try {
		const res = await fetch('/tournaments', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include'
		});
		if (res.ok) {
			const tournaments: Tournaments[] = await res.json();
			return tournaments;
		} else
			console.error('Failed to load tournaments list', await res.text());
	} catch (err) {
		console.error('Error fetching tournaments', err);
		return [];
	}
	return [];
}

export function getCookie(name: string): string | null {
	const cookies = document.cookie.split(';');
	for (let cookie of cookies) {
		const [key, value] = cookie.trim().split('=');
		if (key === name) {
			return decodeURIComponent(value);
		}
	}
	return null;
}

export function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function showModal(message: string) {
	const backdrop = document.createElement('div');
	Object.assign(backdrop.style, {
		position: 'fixed',
		inset: '0',
		background: 'rgba(0,0,0,0.5)',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: '10000',
	});

	const box = document.createElement('div');
	Object.assign(box.style, {
		background: '#fff',
		borderRadius: '8px',
		width: '320px',
		maxWidth: '90%',
		boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
		position: 'relative',
		padding: '24px',
		display: 'flex',
		flexDirection: 'column',
	});

	const messageBox = document.createElement('div');
	messageBox.textContent = message;
	Object.assign(messageBox.style, {
		background: '#f7f7f7',
		padding: '16px',
		borderRadius: '4px',
		margin: '16px 0',
		color: '#333',
		fontSize: '1rem',
		lineHeight: '1.4',
		textAlign: 'center',
	});

	const hr = document.createElement('hr');
	Object.assign(hr.style, {
		border: 'none',
		borderTop: '1px solid #ddd',
		margin: '0 0 16px',
	});

	const footer = document.createElement('div');
	Object.assign(footer.style, {
		display: 'flex',
		justifyContent: 'center',
	});

	const okBtn = document.createElement('button');
	okBtn.textContent = 'OK';
	Object.assign(okBtn.style, {
		padding: '4px 8px',
		border: 'none',
		borderRadius: '4px',
		background: '#007bff',
		color: '#fff',
		cursor: 'pointer',
		fontSize: '0.9rem',
	});
	okBtn.addEventListener('click', () => backdrop.remove());

	footer.appendChild(okBtn);

	box.append(messageBox, hr, footer);
	backdrop.appendChild(box);
	document.body.appendChild(backdrop);
}

export function addToHistory(path: string) {
  if (location.pathname !== path) {
    history.pushState({ path }, "", path);
  }
}