import * as utils from './utils.js';
import * as displayPage from './displayPage.js';
import { gamePage } from './displayPage.js';
import { cleanGlobalChat } from './chatManager.js';

export function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    const saved = localStorage.getItem('theme');
    if (saved)
        document.documentElement.classList.add(saved);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.classList.add('dark');

    btn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

export async function signOut(workArea: HTMLDivElement | null) {

    const menuArea = (document.getElementById('headerArea') as HTMLDivElement | null);

    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include'
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
        initThemeToggle();
        utils.cleanLocalStorage();
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

export function gamePageHandler(workArea: HTMLDivElement | null) {
    gamePage(workArea);
}

export async function chatPage(workArea: HTMLDivElement | null, userId: string, displayName: string) {
    displayPage.chatPage(workArea, userId, displayName);
}

export async function set2FA(e: Event, checkbox: HTMLInputElement | null, span: HTMLSpanElement | null, errorMessage: HTMLSpanElement | null) {
    if (!span || !checkbox) {
        return;
    }

    if (span.getAttribute("data-hidden-value") === "Error") {
        span.setAttribute("data-hidden-value", "OK");
        return;
    }
    if (errorMessage) {
        errorMessage.textContent = "";
    }
    let status = localStorage.getItem('user2FA');
    if (status === 'enabled') {
        status = 'disabled';
    }
    else {
        status = 'enabled';
    }
    try {
        const response = await fetch('/set-2fa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status
            }),
            credentials: 'include'
        });

        const data = await response.json();
        console.log('API response:', data);
        if (!response.ok) {
            const message = data?.error || 'Error setting 2FA.';
            console.error('Error setting 2FA: ', message);
            span.setAttribute("data-hidden-value", "Error");
            await utils.sleep(300);
            checkbox.checked = !checkbox.checked;
            const changeEvent = new Event("change", { bubbles: true });
            checkbox.dispatchEvent(changeEvent);
            if (errorMessage) {
                errorMessage.textContent = message;
            }
            return;
        }
        localStorage.setItem('user2FA', status);
        span.textContent = checkbox.checked ? "Enabled" : "Disabled";
        if (status === 'enabled') {
            span.textContent = "Enabled";
        }
        else {
            span.textContent = "Disabled";
        }
    }
    catch (error) {
        console.error('Error setting 2FA:', error);
    }
}

export async function resetButton() {
    const workArea = (document.getElementById('appArea') as HTMLDivElement | null);

    if (!workArea)
        return;

    const formExists = document.getElementById('resetPassword');
    if (formExists)
        return;
    
    const resetForm = document.createElement('form');
	resetForm.id = 'resetPassword';
	resetForm.classList.add('flex', 'flex-col', 'items-center', 'w-60', 'mx-auto');
    // Creates a heading
	const resetHeading = document.createElement("p");
	resetHeading.textContent = "A link will be sent to reset your password.";
	resetHeading.classList.add("text-1xl", "font-bold", "text-blue-600");
    resetForm.appendChild(resetHeading);

    const resetEmailInput = document.createElement('input');
	resetEmailInput.type = 'resetEmail';
	resetEmailInput.id = "resetEmailInput";
	resetEmailInput.name = 'resetEmail';
	resetEmailInput.placeholder = 'Enter your email';
	resetEmailInput.willValidate;
	resetEmailInput.required = true;
	resetEmailInput.classList.add('w-60', 'm-4', 'border', 'border-blue-500', 'text-blue-700', 'rounded', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    resetForm.appendChild(resetEmailInput);

    const resetSubmitButton = document.createElement('button');
	resetSubmitButton.type = 'submit';
	resetSubmitButton.textContent = 'Send link';
	resetSubmitButton.classList.add('w-60', 'm-4', 'px-4', 'py-2', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-700');
    resetForm.appendChild(resetSubmitButton);

    resetForm.appendChild(document.createElement('br'));

    const resetCancelButton = document.createElement('button');
	resetCancelButton.type = 'submit';
	resetCancelButton.textContent = 'Cancel';
	resetCancelButton.classList.add('w-60', 'm-4', 'px-4', 'py-2', 'bg-gray-500', 'text-white', 'rounded', 'hover:bg-gray-700');
    resetForm.appendChild(resetCancelButton);

    workArea.appendChild(resetForm);

    resetCancelButton.addEventListener("click", () => {
		workArea.removeChild(resetForm);
	});
}

export function showPassword(e: Event, passwordInput: HTMLInputElement | null, toggleButton: HTMLButtonElement | null) {
    if (!passwordInput || !toggleButton) {
        return;
    }
    e.preventDefault();

    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    toggleButton.innerHTML = isHidden ? utils.eyeSlashIcon : utils.eyeIcon;

}
