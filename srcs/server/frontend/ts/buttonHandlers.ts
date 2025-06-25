import * as utils from './utils.js';
import * as displayPage from './displayPage.js';
import { cleanGlobalChat } from './chatManager.js';

export async function signOut(workArea: HTMLDivElement | null) {

    const menuArea = (document.getElementById('headerArea') as HTMLDivElement | null);

    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        console.log('API response:', data);
        if (!response.ok) {
            const message = data?.error || 'logouy failed';
    
            alert(message);
            return;
        }
		
		cleanGlobalChat();
        localStorage.clear();
        displayPage.header(menuArea);
        displayPage.landingPage(workArea, menuArea);
        document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
        document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
        document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
    } catch (error) {
        console.error('Error sending form data:', error);
        alert('Logout failed! Catched on Try');
    }
}

export async function accountSettings(workArea: HTMLDivElement | null) {
    displayPage.accountSettings(workArea);
}

export async function gamePage(workArea: HTMLDivElement | null) {
    displayPage.gamePage(workArea);
}

export async function chatPage(workArea: HTMLDivElement | null, userId: string, displayName: string) {
    displayPage.chatPage(workArea, userId, displayName);
}

export function showPassword(e: Event,  passwordInput: HTMLInputElement | null, toggleButton: HTMLButtonElement | null) {
    if (!passwordInput || !toggleButton) {
        return;
    }
    e.preventDefault();
    
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    toggleButton.innerHTML = isHidden ? utils.eyeSlashIcon : utils.eyeIcon;
}