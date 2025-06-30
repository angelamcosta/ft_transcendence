import * as utils from './utils.js';
import * as formHandlers from './formHandlers.js';
import * as buttonHandlers from './buttonHandlers.js';
import { initPong } from './pong.js';
import { buildDMChatContainer, buildControls, buildDmCard, buildDMInputWrapper, globalSocket, onlineUsers, unreadDM, updateBlockUI, buildGlobalWrapper, buildGlobalChatCard, buildUserListPanel } from './chatManager.js';
import { getUsers, User } from './utils.js';

let activeDM: string | null = null;

export function landingPage(workArea: HTMLDivElement | null, menuArea: HTMLDivElement | null) {
	utils.cleanDiv(workArea);

	// Create <h1>
	const heading = document.createElement("h1");
	heading.textContent = "Welcome to our Game Hub!";
	heading.classList.add("text-3xl", "font-bold", "text-blue-600");

	// Append to div
	workArea?.appendChild(heading);
}

export function signUp(workArea: HTMLDivElement | null, menuArea: HTMLDivElement | null) {
	utils.cleanDiv(workArea);

	const form = document.createElement('form');
	form.id = 'newAccount';
	form.classList.add('flex', 'flex-col', 'items-center');

	// Create an email input
	const emailInput = document.createElement('input');
	emailInput.type = 'email';
	emailInput.id = "emailInput";
	emailInput.name = 'email';
	emailInput.placeholder = 'Enter your email';
	emailInput.willValidate;
	emailInput.required = true;
	emailInput.classList.add('w-60', 'm-4', 'border', 'border-blue-500', 'text-blue-700', 'rounded', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');

	// Create an email input
	const nameInput = document.createElement('input');
	nameInput.type = 'text';
	nameInput.id = "nameInput";
	nameInput.name = 'name';
	nameInput.placeholder = 'Enter your display name';
	nameInput.required = true;
	nameInput.classList.add('w-60', 'm-4', 'border', 'border-blue-500', 'text-blue-700', 'rounded', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');

	const passwordContainer = document.createElement('div');
	passwordContainer.classList.add('relative', 'w-60', 'm-4');

	// Create an email input
	const passwordInput = document.createElement('input');
	passwordInput.type = 'password';
	passwordInput.id = "passwordInput";
	passwordInput.name = 'password';
	passwordInput.placeholder = 'Enter your pasword';
	passwordInput.minLength = 6;
	passwordInput.required = true;
	passwordInput.classList.add('w-full', 'pr-10', 'border', 'border-blue-500', 'text-blue-700', 'rounded', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');

	// Create a toggle button
	const toggleButton = document.createElement('button');
	toggleButton.type = 'button';
	toggleButton.title = "Show password";
	toggleButton.innerHTML = utils.eyeIcon;
	toggleButton.className = "absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center block md:inline-block text-white focus:outline-none";
	toggleButton.style.background = 'transparent';
	passwordContainer.appendChild(passwordInput);
	passwordContainer.appendChild(toggleButton);

	// Create a submit button
	const submitButton = document.createElement('button');
	submitButton.type = 'submit';
	submitButton.textContent = 'Create account';
	submitButton.classList.add('w-60', 'm-4', 'px-4', 'py-2', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-700');

	// Create a reset button button
	const resetButton = document.createElement('button');
	resetButton.id = 'resetButton';
	resetButton.type = 'button';
	resetButton.textContent = 'Reset';
	resetButton.classList.add('px-4', 'py-2', 'bg-gray-500', 'text-white', 'rounded', 'hover:bg-gray-700', 'mr-auto');

	// Create a reset button button
	const cancelButton = document.createElement('button');
	cancelButton.id = 'cancelButton';
	cancelButton.type = 'button';
	cancelButton.textContent = 'Cancel';
	cancelButton.classList.add('px-4', 'py-2', 'bg-gray-500', 'text-white', 'rounded', 'hover:bg-gray-700', 'ml-auto');

	const buttonContainer = document.createElement('div');
	buttonContainer.classList.add('flex', 'w-60', 'm-4');
	buttonContainer.appendChild(resetButton);
	buttonContainer.appendChild(cancelButton);

	// Append elements to form
	form.appendChild(emailInput);
	form.appendChild(document.createElement('br'));
	form.appendChild(nameInput);
	form.appendChild(document.createElement('br'));
	form.appendChild(passwordContainer);
	form.appendChild(document.createElement('br'));
	form.appendChild(submitButton);
	form.appendChild(document.createElement('br'));
	form.appendChild(buttonContainer);

	// Append form and login button to the body
	workArea?.appendChild(form);

	// Handle form submission
	form.addEventListener('submit', formHandlers.signUp);
	toggleButton.addEventListener('click', (e: MouseEvent) => buttonHandlers.showPassword(e, passwordInput, toggleButton));
	resetButton.addEventListener("click", () => {
		form.reset();
	});
	cancelButton.addEventListener("click", () => landingPage(workArea, menuArea));
}

export function signIn(workArea: HTMLDivElement | null, successMessage?: string) {
	utils.cleanDiv(workArea);

	const form = document.createElement('form');
	form.id = 'login';
	form.classList.add('flex', 'flex-col', 'items-center');

	const emailInput = document.createElement('input');
	emailInput.type = 'email';
	emailInput.id = "emailInput";
	emailInput.name = 'email';
	emailInput.placeholder = 'Enter your email';
	emailInput.willValidate;
	emailInput.required = true;
	emailInput.classList.add('w-60', 'm-4', 'border', 'border-blue-500', 'text-blue-700', 'rounded', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');

	const passwordContainer = document.createElement('div');
	passwordContainer.classList.add('relative', 'w-60', 'm-4');

	const passwordInput = document.createElement('input');
	passwordInput.type = 'password';
	passwordInput.id = "passwordInput";
	passwordInput.name = 'password';
	passwordInput.placeholder = 'Enter your pasword';
	passwordInput.minLength = 6;
	passwordInput.required = true;
	passwordInput.classList.add('w-full', 'pr-10', 'border', 'border-blue-500', 'text-blue-700', 'rounded', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');

	// Create a toggle button
	const toggleButton = document.createElement('button');
	toggleButton.type = 'button';
	toggleButton.title = "Show password";
	toggleButton.innerHTML = utils.eyeIcon;
	toggleButton.className = "absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center block md:inline-block text-white focus:outline-none";
	toggleButton.style.background = 'transparent';
	passwordContainer.appendChild(passwordInput);
	passwordContainer.appendChild(toggleButton);

	const submitButton = document.createElement('button');
	submitButton.type = 'submit';
	submitButton.textContent = 'Login';
	submitButton.classList.add('w-60', 'm-4', 'px-4', 'py-2', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-700');

	form.appendChild(emailInput);
	form.appendChild(document.createElement('br'));
	form.appendChild(passwordContainer);
	form.appendChild(document.createElement('br'));
	form.appendChild(submitButton);

	if (successMessage) {
		const msgDiv = document.createElement('div');
		msgDiv.className = 'text-green-600 mt-4 text-sm text-center';
		msgDiv.textContent = successMessage;
		form.appendChild(msgDiv);
	}

	workArea?.appendChild(form);

	form.addEventListener('submit', formHandlers.signIn);
	toggleButton.addEventListener('click', (e: MouseEvent) => buttonHandlers.showPassword(e, passwordInput, toggleButton));
}

export function verify2FA(workArea: HTMLDivElement | null) {
	utils.cleanDiv(workArea);

	const form = document.createElement('form');
	form.id = 'verify';
	form.classList.add('flex', 'flex-col', 'items-center');

	const codeInput = document.createElement('input');
	codeInput.type = 'number';
	codeInput.id = "codeInput";
	codeInput.name = 'code';
	codeInput.placeholder = 'Enter your code';
	codeInput.willValidate;
	codeInput.required = true;
	codeInput.classList.add('w-60', 'm-4', 'border', 'border-blue-500', 'text-blue-700', 'rounded', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');

	const submitButton = document.createElement('button');
	submitButton.type = 'submit';
	submitButton.textContent = 'Verify code';
	submitButton.classList.add('w-60', 'm-4', 'px-4', 'py-2', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-700');

	// Create an error message span
	const errorMessage = document.createElement("span");
	errorMessage.id = "verifyError";
	errorMessage.className = "text-red-500 text-sm ml-2";
	errorMessage.style.minWidth = "1rem";
	errorMessage.textContent = "";

	form.appendChild(codeInput);
	form.appendChild(document.createElement('br'));
	form.appendChild(submitButton);
	form.appendChild(errorMessage);

	workArea?.appendChild(form);

	form.addEventListener('submit', formHandlers.verify2FA);
}

export function dashboard(workArea: HTMLDivElement | null) {
	utils.cleanDiv(workArea);

	// Create <h1>
	const heading = document.createElement("h1");
	heading.textContent = "Welcome to your dashboard!";
	heading.classList.add("text-3xl", "font-bold", "text-blue-600");

	workArea?.appendChild(heading);
}

export function changePassword(workArea: HTMLDivElement | null) {
	const passwordForm = document.createElement('form');
	passwordForm.id = 'changePassword';
	passwordForm.classList.add('flex', 'flex-col', 'items-center', 'w-100', 'mx-auto', 'border', 'border-4', 'border-t-0', 'border-blue-500', 'rounded');

	const oldPasswordContainer = document.createElement('div');
	oldPasswordContainer.classList.add('relative', 'w-60', 'm-4');

	// Create an password input
	const oldPasswordInput = document.createElement('input');
	oldPasswordInput.type = 'password';
	oldPasswordInput.id = "oldPasswordInput";
	oldPasswordInput.name = 'oldPassword';
	oldPasswordInput.placeholder = 'Enter your current pasword';
	oldPasswordInput.minLength = 6;
	oldPasswordInput.required = true;
	oldPasswordInput.classList.add('w-full', 'pr-10', 'border', 'border-blue-500', 'text-blue-700', 'rounded', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');

	// Create a toggle button
	const oldToggleButton = document.createElement('button');
	oldToggleButton.type = 'button';
	oldToggleButton.id = 'oldToggleButton';
	oldToggleButton.title = "Show password";
	oldToggleButton.innerHTML = utils.eyeIcon;
	oldToggleButton.className = "absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center block md:inline-block text-white focus:outline-none";
	oldToggleButton.style.background = 'transparent';
	oldPasswordContainer.appendChild(oldPasswordInput);
	oldPasswordContainer.appendChild(oldToggleButton);

	const newPasswordContainer = document.createElement('div');
	newPasswordContainer.classList.add('relative', 'w-60', 'm-4');

	// Create an password input
	const newPasswordInput = document.createElement('input');
	newPasswordInput.type = 'password';
	newPasswordInput.id = "newPasswordInput";
	newPasswordInput.name = 'newPassword';
	newPasswordInput.placeholder = 'Enter new pasword';
	newPasswordInput.minLength = 6;
	newPasswordInput.required = true;
	newPasswordInput.classList.add('w-full', 'pr-10', 'border', 'border-blue-500', 'text-blue-700', 'rounded', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');

	// Create a toggle button
	const newToggleButton = document.createElement('button');
	newToggleButton.type = 'button';
	newToggleButton.id = 'newToggleButton';
	newToggleButton.title = "Show password";
	newToggleButton.innerHTML = utils.eyeIcon;
	newToggleButton.className = "absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center block md:inline-block text-white focus:outline-none";
	newToggleButton.style.background = 'transparent';
	newPasswordContainer.appendChild(newPasswordInput);
	newPasswordContainer.appendChild(newToggleButton);

	const confirmPasswordContainer = document.createElement('div');
	confirmPasswordContainer.classList.add('relative', 'w-60', 'm-4');

	// Create an password input
	const confirmPasswordInput = document.createElement('input');
	confirmPasswordInput.type = 'password';
	confirmPasswordInput.id = "confirmPasswordInput";
	confirmPasswordInput.name = 'confirmPassword';
	confirmPasswordInput.placeholder = 'Confirm new pasword';
	confirmPasswordInput.minLength = 6;
	confirmPasswordInput.required = true;
	confirmPasswordInput.classList.add('w-full', 'pr-10', 'border', 'border-blue-500', 'text-blue-700', 'rounded', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');

	// Create a toggle button
	const confirmToggleButton = document.createElement('button');
	confirmToggleButton.type = 'button';
	confirmToggleButton.id = 'confirmToggleButton';
	confirmToggleButton.title = "Show password";
	confirmToggleButton.innerHTML = utils.eyeIcon;
	confirmToggleButton.className = "absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center block md:inline-block text-white focus:outline-none";
	confirmToggleButton.style.background = 'transparent';
	confirmPasswordContainer.appendChild(confirmPasswordInput);
	confirmPasswordContainer.appendChild(confirmToggleButton);

	// Create a submit button
	const passwordSubmitButton = document.createElement('button');
	passwordSubmitButton.type = 'submit';
	passwordSubmitButton.textContent = 'Change password';
	passwordSubmitButton.classList.add('px-4', 'py-2', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-700');

	// Create a reset button button
	const passwordResetButton = document.createElement('button');
	passwordResetButton.id = 'passwordResetButton';
	passwordResetButton.type = 'button';
	passwordResetButton.textContent = 'Reset';
	passwordResetButton.classList.add('px-4', 'py-2', 'bg-gray-500', 'text-white', 'rounded', 'hover:bg-gray-700', 'mr-auto');

	const passwordButtonContainer = document.createElement('div');
	passwordButtonContainer.classList.add('flex', 'w-60', 'm-4');
	passwordButtonContainer.appendChild(passwordSubmitButton);
	passwordButtonContainer.appendChild(passwordResetButton);

	// Creates a heading
	const passwordHeading = document.createElement("h1");
	passwordHeading.textContent = "Change password";
	passwordHeading.classList.add("text-3xl", "font-bold", "text-blue-600");

	passwordForm.appendChild(passwordHeading);
	passwordForm.appendChild(oldPasswordContainer);
	passwordForm.appendChild(document.createElement('br'));
	passwordForm.appendChild(newPasswordContainer);
	passwordForm.appendChild(document.createElement('br'));
	passwordForm.appendChild(confirmPasswordContainer);
	passwordForm.appendChild(document.createElement('br'));
	passwordForm.appendChild(passwordButtonContainer);

	// Append passwordForm and login button to the body
	workArea?.appendChild(passwordForm);

	oldToggleButton.addEventListener('click', (e: MouseEvent) => buttonHandlers.showPassword(e, oldPasswordInput, oldToggleButton));
	newToggleButton.addEventListener('click', (e: MouseEvent) => buttonHandlers.showPassword(e, newPasswordInput, newToggleButton));
	confirmToggleButton.addEventListener('click', (e: MouseEvent) => buttonHandlers.showPassword(e, confirmPasswordInput, confirmToggleButton));
	passwordResetButton.addEventListener("click", () => {
		passwordForm.reset();
	});
}

export function changeDisplayName(workArea: HTMLDivElement | null) {
	const nameForm = document.createElement('form');
	nameForm.id = 'changeName';
	nameForm.classList.add('flex', 'flex-col', 'items-center', 'w-100', 'mx-auto', 'border', 'border-4', 'border-t-0', 'border-blue-500', 'rounded');

	const nameContainer = document.createElement('div');
	nameContainer.classList.add('relative', 'w-60', 'm-4');

	// Create an password input
	const nameInput = document.createElement('input');
	nameInput.type = 'text';
	nameInput.id = "nameInput";
	nameInput.name = 'name';
	nameInput.placeholder = 'Enter new display name';
	nameInput.required = true;
	nameInput.classList.add('w-full', 'pr-10', 'border', 'border-blue-500', 'text-blue-700', 'rounded', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
	nameContainer.appendChild(nameInput);

	// Create a submit button
	const nameSubmitButton = document.createElement('button');
	nameSubmitButton.type = 'submit';
	nameSubmitButton.textContent = 'Change name';
	nameSubmitButton.classList.add('px-4', 'py-2', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-700');

	// Create a reset button button
	const nameResetButton = document.createElement('button');
	nameResetButton.id = 'nameResetButton';
	nameResetButton.type = 'button';
	nameResetButton.textContent = 'Reset';
	nameResetButton.classList.add('px-4', 'py-2', 'bg-gray-500', 'text-white', 'rounded', 'hover:bg-gray-700', 'mr-auto');

	const nameButtonContainer = document.createElement('div');
	nameButtonContainer.classList.add('flex', 'w-60', 'm-4');
	nameButtonContainer.appendChild(nameSubmitButton);
	nameButtonContainer.appendChild(nameResetButton);

	// Creates a heading
	const nameHeading = document.createElement("h1");
	nameHeading.textContent = "Change display name";
	nameHeading.classList.add("text-3xl", "font-bold", "text-blue-600");

	nameForm.appendChild(nameHeading);
	nameForm.appendChild(nameContainer);
	nameForm.appendChild(document.createElement('br'));
	nameForm.appendChild(nameButtonContainer);

	// Append nameForm and login button to the body
	workArea?.appendChild(nameForm);

	nameResetButton.addEventListener("click", () => {
		nameForm.reset();
	});
}

export function manageTwoFactorAuth(workArea: HTMLDivElement | null) {
	const user2FA = localStorage.getItem('user2FA')!;

	const twoFactorForm = document.createElement('form');
	twoFactorForm.id = 'set2FA';
	twoFactorForm.classList.add('flex', 'flex-col', 'items-center', 'w-100', 'mx-auto', 'border', 'border-4', 'border-t-0', 'border-blue-500', 'rounded');

	const twoFactorContainer = document.createElement('div');
	twoFactorContainer.classList.add('flex', 'items-center', 'gap-2', 'relative', 'w-60', 'm-4');

	// Creates a heading
	const twoFactorHeading = document.createElement("h1");
	twoFactorHeading.textContent = "Manage Two Factor Authentication";
	twoFactorHeading.classList.add("text-3xl", "font-bold", "text-blue-600");

	// Create the label span
	const labelSpan = document.createElement("span");
	labelSpan.id = "toggle-label";
	labelSpan.className = "text-sm font-medium text-gray-800";

	// Create the label wrapper
	const label = document.createElement("label");
	label.className = "relative inline-flex items-center cursor-pointer";

	// Create the checkbox input
	const twoFactorCheckbox = document.createElement("input");
	twoFactorCheckbox.type = "checkbox";
	twoFactorCheckbox.id = "toggle";
	twoFactorCheckbox.className = "sr-only peer";

	// Create the track div
	const track = document.createElement("div");
	track.id = "twoFactorTrack";

	// Create the knob div
	const knob = document.createElement("div");
	knob.id = "twoFactorKnob";

	labelSpan.setAttribute("data-hidden-value", "OK");
	if (user2FA === 'enabled') {
		labelSpan.textContent = "Enabled";
		track.className = "w-14 h-8 bg-blue-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-500 rounded-full peer peer-checked:bg-gray-500 transition-colors duration-300";
		knob.className = "absolute right-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 transform peer-checked:-translate-x-6";
	}
	else {
		labelSpan.textContent = "Disabled";
		track.className = "w-14 h-8 bg-gray-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-500 rounded-full peer peer-checked:bg-blue-500 transition-colors duration-300";
		knob.className = "absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 transform peer-checked:translate-x-6";
	}

	// Create an error message span
	const errorMessage = document.createElement("span");
	errorMessage.id = "twoFactorError";
	errorMessage.className = "text-red-500 text-sm ml-2";
	errorMessage.style.minWidth = "1rem";
	errorMessage.textContent = "";

	// Append elements appropriately
	label.appendChild(twoFactorCheckbox);
	label.appendChild(track);
	label.appendChild(knob);

	twoFactorContainer.appendChild(labelSpan);
	twoFactorContainer.appendChild(label);
	twoFactorContainer.appendChild(errorMessage);

	// Add to the body (or any other container)
	twoFactorForm.appendChild(twoFactorHeading);
	twoFactorForm.appendChild(twoFactorContainer);

	// Append twoFactorForm and login button to the body
	workArea?.appendChild(twoFactorForm);

	// Add toggle behavior
	twoFactorCheckbox.addEventListener("change", (e: Event) => buttonHandlers.set2FA(e, twoFactorCheckbox, labelSpan, errorMessage));
}

export function accountSettings(workArea: HTMLDivElement | null) {
	utils.cleanDiv(workArea);

	changePassword(workArea);
	changeDisplayName(workArea);
	manageTwoFactorAuth(workArea);
}

export function menu(menuArea: HTMLDivElement | null, workArea: HTMLDivElement | null) {
	utils.cleanDiv(menuArea);

	const nav = document.createElement("nav");
	nav.className = "bg-blue-500 shadow-md";

	const container = document.createElement("div");
	container.className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

	const inner = document.createElement("div");
	inner.className = "flex items-center justify-between h-16";

	const logo = document.createElement("button");
	logo.id = "dashboardButton";
	logo.type = "button";
	logo.className = "text-xl font-bold text-white hover:text-blue-800 focus:outline-none";
	logo.textContent = "Our game hub";

	const menu = document.createElement("div");
	menu.id = "menu";
	menu.className = "hidden md:flex space-x-4";

	const playButton = document.createElement('button');
	playButton.type = "button";
	playButton.textContent = 'Play';
	playButton.id = "playButton";
	playButton.title = "New Game";
	playButton.innerHTML = '<svg class="w-6 h-6 mr-2 fill-current" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><path d="M45.563,29.174l-22-15c-0.307-0.208-0.703-0.231-1.031-0.058C22.205,14.289,22,14.629,22,15v30 c0,0.371,0.205,0.711,0.533,0.884C22.679,45.962,22.84,46,23,46c0.197,0,0.394-0.059,0.563-0.174l22-15 C45.836,30.64,46,30.331,46,30S45.836,29.36,45.563,29.174z M24,43.107V16.893L43.225,30L24,43.107z"/></svg>Play';
	playButton.className = "block md:inline-block px-4 py-2 text-white hover:text-blue-800 focus:outline-none";
	playButton.addEventListener("click", () => buttonHandlers.gamePageHandler(workArea));
	menu.appendChild(playButton);

	const chatButton = document.createElement("button");
	chatButton.type = "button";
	chatButton.id = "chatButton";
	chatButton.title = "Chat room";
	chatButton.innerHTML += '<svg vg class="fill-none stroke-current w-8 h-8 mr-2" viewBox="0 0 024 024" xmlns="http://www.w3.org/2000/svg">\
    <path d="M8 10.5H16"/>\
    <path d="M8 14H13.5"/>\
    <path d="M17 3.33782C15.5291 2.48697 13.8214 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22C17.5228 22 22 17.5228 22 12C22 10.1786 21.513 8.47087 20.6622 7"/>\
    </svg>';
	chatButton.className = "block md:inline-block px-4 py-2 text-white hover:text-blue-800 focus:outline-none";
	menu.appendChild(chatButton);

	const friendsButton = document.createElement("button");
	friendsButton.type = "button";
	friendsButton.title = "My friends";
	friendsButton.innerHTML += '<svg vg class="fill-current w-8 h-8 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">\
    <path d="M11 8.5C11 9.88071 9.88071 11 8.5 11C7.11929 11 6 9.88071 6 8.5C6 7.11929 7.11929 6 8.5 6C9.88071 6 11 7.11929 11 8.5Z"/>\
    <path d="M18 5.5C18 6.88071 16.8807 8 15.5 8C14.1193 8 13 6.88071 13 5.5C13 4.11929 14.1193 3 15.5 3C16.8807 3 18 4.11929 18 5.5Z"/>\
    <path d="M15.5 20C14.5 21 3.00002 20.5 2.00001 20C1 19.5 5.41016 15 9.00001 15C12.5899 15 16.076 19.424 15.5 20Z"/>\
    <path d="M15.3522 16.2905C16.0024 16.991 16.5501 17.7108 16.9695 18.3146C17.4791 18.3176 18.1122 18.3174 18.7714 18.3075C19.5445 18.296 20.365 18.2711 21.0682 18.2214C21.4193 18.1965 21.7527 18.1647 22.0422 18.1231C22.3138 18.0841 22.6125 18.028 22.8585 17.9335C23.0969 17.8419 23.3323 17.6857 23.5095 17.4429C23.6862 17.2007 23.7604 16.9334 23.7757 16.6907C23.8039 16.2435 23.6381 15.8272 23.4749 15.5192C23.1328 14.8736 22.5127 14.1722 21.7887 13.5408C20.3574 12.2925 18.1471 11 16 11C14.8369 11 13.97 11.1477 13.192 11.5887C12.4902 11.9866 11.9357 12.5909 11.3341 13.2466L11.2634 13.3236L11.1127 13.4877C11.8057 13.6622 12.4547 13.9653 13.0499 14.337C13.5471 13.8034 13.845 13.5176 14.1784 13.3285C14.5278 13.1305 14.998 13 16 13C17.4427 13 19.196 13.9334 20.4741 15.048C20.9492 15.4624 21.3053 15.8565 21.5299 16.1724C21.3524 16.1926 21.15 16.2106 20.927 16.2263C20.2775 16.2723 19.4991 16.2964 18.7416 16.3077C17.9864 16.319 17.2635 16.3174 16.7285 16.3129C16.4612 16.3106 16.2416 16.3077 16.089 16.3053C16.0127 16.3041 15.9533 16.303 15.9131 16.3023L15.8676 16.3014L15.8562 16.3012L15.8535 16.3011L15.8529 16.3011L15.8528 16.3011L15.8528 16.3011L15.3522 16.2905Z"/>\
    </svg>';
	friendsButton.className = "block md:inline-block px-4 py-2 text-white hover:text-blue-800 focus:outline-none";
	menu.appendChild(friendsButton);

	const settingsButton = document.createElement("button");
	settingsButton.type = "button";
	settingsButton.id = "accountSettingsButton";
	settingsButton.title = "Account settings";
	settingsButton.innerHTML += '<svg vg class="fill-current w-8 h-8 mr-2" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M772.672 575.808V448.192l70.848-70.848a370.688 370.688 0 0 0-56.512-97.664l-96.64 25.92-110.528-63.808-25.92-96.768a374.72 374.72 0 0 0-112.832 0l-25.92 96.768-110.528 63.808-96.64-25.92c-23.68 29.44-42.816 62.4-56.576 97.664l70.848 70.848v127.616l-70.848 70.848c13.76 35.264 32.832 68.16 56.576 97.664l96.64-25.92 110.528 63.808 25.92 96.768a374.72 374.72 0 0 0 112.832 0l25.92-96.768 110.528-63.808 96.64 25.92c23.68-29.44 42.816-62.4 56.512-97.664l-70.848-70.848z m39.744 254.848l-111.232-29.824-55.424 32-29.824 111.36c-37.76 10.24-77.44 15.808-118.4 15.808-41.024 0-80.768-5.504-118.464-15.808l-29.888-111.36-55.424-32-111.168 29.824A447.552 447.552 0 0 1 64 625.472L145.472 544v-64L64 398.528A447.552 447.552 0 0 1 182.592 193.28l111.168 29.824 55.424-32 29.888-111.36A448.512 448.512 0 0 1 497.472 64c41.024 0 80.768 5.504 118.464 15.808l29.824 111.36 55.424 32 111.232-29.824c56.32 55.68 97.92 126.144 118.592 205.184L849.472 480v64l81.536 81.472a447.552 447.552 0 0 1-118.592 205.184zM497.536 627.2a115.2 115.2 0 1 0 0-230.4 115.2 115.2 0 0 0 0 230.4z m0 76.8a192 192 0 1 1 0-384 192 192 0 0 1 0 384z"/></svg>';
	settingsButton.className = "block md:inline-block px-4 py-2 text-white hover:text-blue-800 focus:outline-none";
	menu.appendChild(settingsButton);

	const logoutButton = document.createElement("button");
	logoutButton.type = "button";
	logoutButton.id = "signOutButton";
	logoutButton.title = "Sign Out";
	logoutButton.innerHTML += '<svg vg class="fill-current w-8 h-8 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.6053 12.9474C17.6053 16.014 15.1193 18.5 12.0526 18.5C8.986 18.5 6.5 16.014 6.5 12.9474C6.5 11.1423 7.36133 9.53838 8.69541 8.52423C9.09037 8.22399 9.36842 7.77755 9.36842 7.28142V7.28142C9.36842 6.34022 8.43174 5.69142 7.64453 6.20732C5.4497 7.64569 4 10.1272 4 12.9474C4 17.3947 7.60529 21 12.0526 21C16.5 21 20.1053 17.3947 20.1053 12.9474C20.1053 10.1272 18.6556 7.64569 16.4607 6.20732C15.6735 5.69142 14.7368 6.34022 14.7368 7.28142V7.28142C14.7368 7.77755 15.0149 8.22399 15.4099 8.52423C16.7439 9.53838 17.6053 11.1423 17.6053 12.9474Z"/><rect x="10.75" y="4" width="2.5" height="9" rx="1.25"/></svg>';
	logoutButton.className = "block md:inline-block px-4 py-2 text-white hover:text-blue-800 focus:outline-none";
	menu.appendChild(logoutButton);

	const themeBtn = document.createElement("button");
	themeBtn.id = "theme-toggle";
	themeBtn.type = "button";
	themeBtn.className = "p-2 bg-background text-foreground hover:bg-primary hover:text-white transition";
	themeBtn.innerText = "🌓";
	menu.appendChild(themeBtn);

	inner.appendChild(logo);
	inner.appendChild(menu);
	container.appendChild(inner);
	nav.appendChild(container);

	menuArea?.appendChild(nav);
}

export function header(headerArea: HTMLDivElement | null) {
	utils.cleanDiv(headerArea);

	const nav = document.createElement("nav");
	nav.className = "bg-blue-500 shadow-md";

	const container = document.createElement("div");
	container.className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

	const inner = document.createElement("div");
	inner.className = "flex items-center justify-between h-16";

	const logo = document.createElement("button");
	logo.id = "landButton";
	logo.type = "button";
	logo.className = "text-xl font-bold text-white hover:text-blue-800 focus:outline-none";
	logo.textContent = "Our game hub";

	const menu = document.createElement("div");
	menu.id = "menu";
	menu.className = "hidden md:flex space-x-4";

	const signInButton = document.createElement("button");
	signInButton.id = "signInButton";
	signInButton.type = "button";
	signInButton.title = "Sign In";
	signInButton.textContent = "Sign In";
	signInButton.className = "block md:inline-block px-4 py-2 text-white hover:text-blue-800 focus:outline-none";
	menu.appendChild(signInButton);

	const signUpButton = document.createElement("button");
	signUpButton.id = "signUpButton";
	signUpButton.type = "button";
	signUpButton.title = "Sign Up";
	signUpButton.textContent = "Sign Up";
	signUpButton.className = "block md:inline-block px-4 py-2 text-white hover:text-blue-800 focus:outline-none";
	menu.appendChild(signUpButton);

	const themeBtn = document.createElement("button");
	themeBtn.id = "theme-toggle";
	themeBtn.type = "button";
	themeBtn.className = "p-2 bg-background text-foreground hover:bg-primary hover:text-white transition";
	themeBtn.innerText = "🌓";
	menu.appendChild(themeBtn);

	inner.appendChild(logo);
	inner.appendChild(menu);
	container.appendChild(inner);
	nav.appendChild(container);

	headerArea?.appendChild(nav);
}

export async function chatPage(workArea: HTMLDivElement | null, userId: string, display_name: string) {
	activeDM = null;
	const headerArea = document.getElementById('headerArea')! as HTMLDivElement;

	if (!workArea || !headerArea)
		return;

	utils.cleanDiv(workArea);

	const wrapper = buildGlobalWrapper(headerArea);

	const { chatCard, chatContainer, messageInput, sendBtn } = buildGlobalChatCard();
	const { userListCard, userListContainer } = buildUserListPanel();

	wrapper.append(chatCard, userListCard);
	workArea.appendChild(wrapper);

	const registeredUsers: User[] = await getUsers();

	function renderUserList() {
		userListContainer.innerHTML = '';

		const onlineList = registeredUsers.filter(user => onlineUsers.has(user.display_name));
		const offlineList = registeredUsers.filter(user => !onlineUsers.has(user.display_name));

		const render = (user: User) => {
			const el = document.createElement('div');
			Object.assign(el.style, {
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'flex-start',
				padding: '4px 8px',
				cursor: user.display_name !== display_name ? 'pointer' : 'default'
			});

			const dot = document.createElement('span');
			Object.assign(dot.style, {
				width: '8px',
				height: '8px',
				borderRadius: '50%',
				background: onlineUsers.has(user.display_name) ? 'green' : 'transparent',
				marginRight: '8px',
				flexShrink: '0',
			});
			el.appendChild(dot);

			const nameEl = document.createElement('span');
			nameEl.textContent = user.display_name;
			if (user.display_name === display_name)
				nameEl.style.fontWeight = 'bold';
			el.appendChild(nameEl);

			if (unreadDM.has(user.display_name))
				nameEl.style.animation = 'blink-color 1s infinite';

			if (user.display_name !== display_name)
				el.addEventListener('click', () => openDirectMessage(user.display_name, user.id));
			userListContainer.appendChild(el);
		};
		onlineList.forEach(render);
		offlineList.forEach(render);
	}

	renderUserList();
	window.addEventListener('global-presence-updated', renderUserList);

	globalSocket!.addEventListener('open', () => {
		globalSocket!.send(JSON.stringify({ type: 'identify', userId }));
	});
	globalSocket!.addEventListener('message', async evt => {
		let dataStr: string;
		if (typeof evt.data === 'string')
			dataStr = evt.data;
		else if (evt.data instanceof Blob)
			dataStr = await evt.data.text();
		else
			dataStr = new TextDecoder().decode(evt.data);

		const msg = JSON.parse(dataStr);

		switch (msg.type) {
			case 'identify':
				renderUserList();
				break;
			case 'join':
				renderUserList();
				appendSystemMessage(`${msg.display_name} joined the chat`);
				break;
			case 'leave':
				renderUserList();
				appendSystemMessage(`${msg.display_name} left the chat`);
				break;
			case 'dm-notification':
				if (msg.from !== activeDM) {
					unreadDM.add(msg.from);
					renderUserList();
				}
				break;
			case 'message':
				appendMessage({
					display_name: msg.display_name,
					content: msg.content,
					timestamp: msg.timestamp,
				});
				break;
		}
	});
	globalSocket!.addEventListener('error', err => console.error('Global chat error', err));

	function sendMessage() {
		const content = messageInput.value.trim();
		if (!content)
			return;

		const payload = JSON.stringify({ type: 'message', content });
		globalSocket!.send(payload);
		appendMessage({ display_name, content, timestamp: Date.now() });
		messageInput.value = '';
	}
	sendBtn.addEventListener('click', sendMessage);

	messageInput.addEventListener('keydown', (e) => {
		if (e.key == 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	})

	function appendMessage(msg: {
		display_name: string;
		content: string;
		timestamp: number;
	}) {
		const messageWrapper = document.createElement('div');
		messageWrapper.style.marginBottom = '8px';

		const line = document.createElement('div');
		line.style.textAlign = msg.display_name === display_name ? 'right' : 'left';
		line.textContent = `${msg.display_name}: ${msg.content}`;
		messageWrapper.appendChild(line);

		const time = document.createElement('div');
		time.style.fontSize = '0.7em';
		time.style.color = '#666';
		time.style.marginTop = '2px';
		time.style.textAlign = line.style.textAlign;

		time.textContent = new Date(msg.timestamp).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		});
		messageWrapper.appendChild(time);

		chatContainer.appendChild(messageWrapper);
		chatContainer.scrollTop = chatContainer.scrollHeight;
	}

	function appendSystemMessage(text: string) {
		const line = document.createElement('div');
		line.style.textAlign = 'center';
		line.style.fontStyle = 'italic';
		line.textContent = text;
		chatContainer.appendChild(line);
		chatContainer.scrollTop = chatContainer.scrollHeight;
	}

	function openDirectMessage(targetName: string, targetId: number) {
		utils.cleanDiv(workArea);
		activeDM = targetName;
		if (unreadDM.has(targetName)) {
			unreadDM.delete(targetName);
			renderUserList();
		}
		directMessagePage(workArea, display_name, targetName, userId, targetId);
	}
}

export async function directMessagePage(
	workArea: HTMLDivElement | null,
	displayName: string, targetName: string,
	userId: string, targetId: number
) {
	const headerArea = document.getElementById('headerArea')! as HTMLDivElement;

	if (!workArea || !headerArea) return;
	utils.cleanDiv(workArea);


	const { wrapper, dmCard } = buildDmCard(targetName, headerArea);

	const banner = document.createElement('div');
	banner.style.padding = '8px';
	banner.style.textAlign = 'center';
	banner.style.fontStyle = 'italic';

	const chatContainer = buildDMChatContainer();

	const messageInput = document.createElement('input');
	messageInput.placeholder = 'Type a message…';
	Object.assign(messageInput.style, {
		flex: '1 1 auto',
		padding: '4px 8px',
		border: '1px solid #ccc',
		borderRadius: '4px',
	});

	const sendBtn = document.createElement('button');
	sendBtn.textContent = 'Send';
	Object.assign(sendBtn.style, {
		marginLeft: '8px',
		padding: '4px 12px',
		border: '1px solid #007bff',
		background: '#007bff',
		color: '#fff',
		borderRadius: '4px',
		cursor: 'pointer',
	});
	const inputWrapper = buildDMInputWrapper(sendBtn, messageInput);

	const addFriendBtn = document.createElement('button');
	addFriendBtn.textContent = 'Add Friend';
	Object.assign(addFriendBtn.style, {
		background: '#28a745',
		color: '#fff',
		border: '1px solid #28a745',
		padding: '2px 3px',
		fontSize: '0.875rem',
		borderRadius: '4px',
		cursor: 'pointer',
	});

	const viewProfileBtn = document.createElement('button');
	viewProfileBtn.textContent = 'View Profile';
	Object.assign(viewProfileBtn.style, {
		background: '#17a2b8',
		color: '#fff',
		border: '1px solid #17a2b8',
		padding: '2px 3px',
		fontSize: '0.875rem',
		borderRadius: '4px',
		cursor: 'pointer',
	});

	const inviteBtn = document.createElement('button');
	inviteBtn.textContent = 'Invite to Game';
	Object.assign(inviteBtn.style, {
		background: '#007bff',
		color: '#fff',
		border: '1px solid #007bff',
		padding: '2px 3px',
		fontSize: '0.875rem',
		borderRadius: '4px',
		cursor: 'pointer',
	});

	const blockBtn = document.createElement('button');
	blockBtn.textContent = 'Block User';
	Object.assign(blockBtn.style, {
		background: '#dc3545',
		color: '#fff',
		border: '1px solid #dc3545',
		padding: '2px 3px',
		fontSize: '0.875rem',
		borderRadius: '4px',
		cursor: 'pointer',
	});

	let invitePending = false;
	async function refreshInviteStatus() {
		let sentData: unknown;
		try {
			const res = await fetch('/users/invite/sent', { credentials: 'include' });
			sentData = await res.json();
		} catch (err) {
			console.error('Error fetching sent invites', err);
			sentData = [];
		}

		const sent = Array.isArray(sentData) ? sentData : [];

		invitePending = sent.some((i: any) => i.friend_id === targetId);
		inviteBtn.textContent = invitePending ? 'Cancel Invite' : 'Invite to Game';
	}

	inviteBtn.addEventListener('click', async () => {
		inviteBtn.disabled = true;
		try {
			if (!invitePending) {
				const res = await fetch(`/users/invite/${targetId}`, {
					method: 'POST',
					credentials: 'include'
				});
				if (!res.ok) throw new Error(await res.text());
			} else {
				const res = await fetch(`/users/invite/cancel/${targetId}`, {
					method: 'PUT',
					credentials: 'include'
				});
				if (!res.ok) throw new Error(await res.text());
			}
			invitePending = !invitePending;
			inviteBtn.textContent = invitePending ? 'Cancel Invite' : 'Invite to Game';
		} catch (err) {
			console.error('Invite error', err);
			alert('Couldn’t update invite: ' + err);
		} finally {
			inviteBtn.disabled = false;
		}
	});

	let isBlocked = false;
	async function refreshBlockStatus() {
		const res = await fetch(`/users/block/status/${targetId}`, {
			credentials: 'include'
		});
		const { blocked } = await res.json();
		isBlocked = blocked;
		blockBtn.textContent = isBlocked ? 'Unblock User' : 'Block User';
	}

	blockBtn.addEventListener('click', async () => {
		blockBtn.disabled = true;
		try {
			if (!isBlocked) {
				const res = await fetch(`/users/block/${targetId}`, {
					method: 'POST',
					credentials: 'include'
				});
				if (!res.ok) throw new Error(await res.text());
			} else {
				const res = await fetch(`/users/unblock/${targetId}`, {
					method: 'DELETE',
					credentials: 'include'
				});
				if (!res.ok) throw new Error(await res.text());
			}
			isBlocked = !isBlocked;
			blockBtn.textContent = isBlocked ? 'Unblock User' : 'Block User';
		} catch (err) {
			console.error('Block error', err);
			alert('Couldn’t update block status: ' + err);
		} finally {
			blockBtn.disabled = false;
			await updateBlockUI(targetId, dmCard, chatContainer, messageInput, sendBtn, banner);
		}
	});

	const controls = buildControls(
		() => console.log('add friend'),
		() => console.log('view profile'),
		inviteBtn,
		blockBtn
	);
	dmCard.append(controls, chatContainer, inputWrapper);
	wrapper.append(dmCard);
	workArea.append(wrapper);

	await Promise.all([refreshInviteStatus(), refreshBlockStatus(), updateBlockUI(targetId, dmCard, chatContainer, messageInput, sendBtn, banner)]);

	const wsUrl = `wss://localhost:9000/dm`;
	const ws = new WebSocket(wsUrl);
	ws.binaryType = 'arraybuffer';

	ws.onopen = () => {
		ws.send(JSON.stringify({
			type: 'direct-join',
			targetName
		}));
	};

	ws.onmessage = async evt => {
		let dataStr: string;
		if (typeof evt.data === 'string')
			dataStr = evt.data;
		else if (evt.data instanceof Blob)
			dataStr = await evt.data.text();
		else
			dataStr = new TextDecoder().decode(evt.data);

		const msg = JSON.parse(dataStr);
		if (msg.type === 'history') {
			msg.messages.forEach((m: { sender_id: number, content: string, timestamp: number }) => {
				appendMessage({
					displayName: m.sender_id.toString() === userId ? displayName : targetName,
					content: m.content,
					timestamp: m.timestamp
				});
			});
		} else if (msg.type === 'message') {
			if (msg.display_name === displayName) return;
			appendMessage({
				displayName: msg.display_name,
				content: msg.content,
				timestamp: msg.timestamp
			});
		}
	};

	function sendMessage() {
		const content = messageInput.value.trim();
		if (!content)
			return;

		const payload = JSON.stringify({ type: 'message', content });
		ws.send(payload);
		appendMessage({ displayName, content, timestamp: Date.now() });
		messageInput.value = '';
	}

	function appendMessage(msg: {
		displayName: string;
		content: string;
		timestamp: number;
	}) {
		const messageWrapper = document.createElement('div');
		messageWrapper.style.marginBottom = '8px';

		const line = document.createElement('div');
		line.style.textAlign = msg.displayName === displayName ? 'right' : 'left';
		line.textContent = `${msg.displayName}: ${msg.content}`;
		messageWrapper.appendChild(line);

		const time = document.createElement('div');
		time.style.fontSize = '0.7em';
		time.style.color = '#666';
		time.style.marginTop = '2px';
		time.style.textAlign = line.style.textAlign;

		time.textContent = new Date(msg.timestamp).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		});
		messageWrapper.appendChild(time);

		chatContainer.appendChild(messageWrapper);
		chatContainer.scrollTop = chatContainer.scrollHeight;
	}

	sendBtn.addEventListener('click', sendMessage);
	messageInput.addEventListener('keydown', e => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	});
}

// TODO : - game won't present errors, but won't start
export function gamePage(workArea: HTMLDivElement | null) {
	if (!workArea)
		return;
	utils.cleanDiv(workArea);

	const canvas = document.createElement('canvas');

	canvas.id = 'pong';
	canvas.width = 600;
	canvas.height = 600;

	workArea.appendChild(canvas);

	initPong(canvas);
}