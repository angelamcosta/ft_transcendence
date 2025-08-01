import * as utils from './utils.js';
import * as formHandlers from './formHandlers.js';
import * as buttonHandlers from './buttonHandlers.js';
import { initPong } from './pong.js';
import { setActiveDM, renderUserList, setupGlobalChatSocket, sendMessage } from './globalChatManager.js';
import { buildChatUI } from './globalChatUI.js'
import { buildDmUI } from './dmChatUI.js'
import { getUsers } from './utils.js';
import { sendDmMessage, setupDmChatControls, setupDmChatSocket } from './dmChatManager.js';
import { buildProfile } from './profileManager.js';
import { buildFriendsList } from './friendsListUI.js';
import { buildTournamentsPage } from './tournaments.js';
import { pongPvpMatchUI } from './pongUI.js';

export function landingPage(workArea: HTMLDivElement | null) {
	utils.cleanDiv(workArea);

	// Saves to browser history
	utils.addToHistory("/");

	// Add header menu
	utils.initAppHeader();

	const container = document.createElement('div');
	container.id = 'landingPageContainer';
	container.classList.add('w-100', 'flex', 'flex-col', 'items-center', 'mx-auto', 'my-4', 'p-4', 'bg-white', 'rounded-xl', 'shadow');

	// Create <h1>
	const heading = document.createElement("h1");
	heading.textContent = "Welcome to our Game Hub!";
	heading.classList.add("text-3xl", "font-bold", "text-blue-600");

	// Append to div
	container.appendChild(heading);
	workArea?.appendChild(container);
}

export function signUp(workArea: HTMLDivElement | null, menuArea: HTMLDivElement | null) {
	utils.cleanDiv(workArea);

	// Saves to browser history
	utils.addToHistory("/register");

	// Add header menu
	utils.initAppHeader();

	const form = document.createElement('form');
	form.id = 'newAccount';
	form.classList.add('w-80', 'flex', 'flex-col', 'items-center', 'mx-auto', 'my-4', 'p-4', 'bg-white', 'rounded-xl', 'shadow');

	// Create an email input
	const emailInput = document.createElement('input');
	emailInput.type = 'email';
	emailInput.id = "emailInput";
	emailInput.name = 'email';
	emailInput.placeholder = 'Enter your email';
	emailInput.willValidate;
	emailInput.required = true;
	emailInput.classList.add('flex-1', 'p-1', 'px-3', 'border', 'border-gray-300', 'rounded-sm', 'mt-2');

	// Create an email input
	const nameInput = document.createElement('input');
	nameInput.type = 'text';
	nameInput.id = "nameInput";
	nameInput.name = 'name';
	nameInput.placeholder = 'Enter your display name';
	nameInput.required = true;
	nameInput.classList.add('flex-1', 'p-1', 'px-3', 'border', 'border-gray-300', 'rounded-sm', 'mt-2');

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
	passwordInput.classList.add('flex-1', 'p-1', 'px-3', 'border', 'border-gray-300', 'rounded-sm');

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
	cancelButton.addEventListener("click", () => landingPage(workArea));
}

export function signIn(workArea: HTMLDivElement | null, successMessage?: string, isError?: boolean) {
	utils.cleanDiv(workArea);

	// Saves to browser history
	utils.addToHistory("/login");

	// Add header menu
	utils.initAppHeader();

	const form = document.createElement('form');
	form.id = 'login';
	form.classList.add('w-80', 'flex', 'flex-col', 'items-center', 'mx-auto', 'my-4', 'p-4', 'bg-white', 'rounded-xl', 'shadow');

	const emailInput = document.createElement('input');
	emailInput.type = 'email';
	emailInput.id = "emailInput";
	emailInput.name = 'email';
	emailInput.placeholder = 'Enter your email';
	emailInput.willValidate;
	emailInput.required = true;
	emailInput.classList.add('flex-1', 'p-1', 'px-3', 'border', 'border-gray-300', 'rounded-sm', 'mt-2');

	const passwordContainer = document.createElement('div');
	passwordContainer.classList.add('relative', 'w-60', 'm-4');

	const passwordInput = document.createElement('input');
	passwordInput.type = 'password';
	passwordInput.id = "passwordInput";
	passwordInput.name = 'password';
	passwordInput.placeholder = 'Enter your pasword';
	passwordInput.minLength = 6;
	passwordInput.required = true;
	passwordInput.classList.add('flex-1', 'p-1', 'px-3', 'border', 'border-gray-300', 'rounded-sm');

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
	submitButton.classList.add('px-5', 'py-1', 'text-sm', 'bg-blue-500', 'text-white', 'rounded', 'cursor-pointer');

	const resetButton = document.createElement('button');
	resetButton.type = 'button';
	resetButton.id = "resetButton";
	resetButton.textContent = 'Forgot password?';
	resetButton.classList.add('text-blue-500', 'hover:underline', 'text-sm', 'mt-2');
	resetButton.style.background = 'transparent';
	resetButton.style.border = 'none';

	form.appendChild(emailInput);
	form.appendChild(document.createElement('br'));
	form.appendChild(passwordContainer);
	form.appendChild(document.createElement('br'));
	form.appendChild(submitButton);
	form.appendChild(document.createElement('br'));
	form.appendChild(resetButton);

	if (successMessage) {
		const msgDiv = document.createElement('div');
		msgDiv.id = "successMessage";
		if (isError) {
			msgDiv.className = 'text-red-600 mt-4 text-sm text-center';
		}
		else {
			msgDiv.className = 'text-green-600 mt-4 text-sm text-center';
		}
		msgDiv.textContent = successMessage;
		form.appendChild(msgDiv);
	}

	workArea?.appendChild(form);

	form.addEventListener('submit', formHandlers.signIn);
	toggleButton.addEventListener('click', (e: MouseEvent) => buttonHandlers.showPassword(e, passwordInput, toggleButton));
	resetButton.addEventListener('click', () => buttonHandlers.resetButton());
}

export function sendLink(workArea: HTMLDivElement | null) {
	if (!workArea)
		return;

	const resetForm = document.createElement('form');
	resetForm.id = 'resetPassword';
	resetForm.classList.add('w-80', 'flex', 'flex-col', 'items-center', 'mx-auto', 'my-4', 'p-4', 'bg-white', 'rounded-xl', 'shadow');

	// Creates a heading
	const resetHeading = document.createElement("p");
	resetHeading.textContent = "A link will be sent to reset your password";
	resetHeading.classList.add("text-1xl", "font-bold", "text-blue-600", 'mb-4');
	resetForm.appendChild(resetHeading);

	const inputAndButtonsWrapper = document.createElement('div');
	inputAndButtonsWrapper.classList.add('w-60', 'flex', 'flex-col', 'items-center');

	const resetEmailInput = document.createElement('input');
	resetEmailInput.type = 'resetEmail';
	resetEmailInput.id = "resetEmailInput";
	resetEmailInput.name = 'resetEmail';
	resetEmailInput.placeholder = 'Enter your email';
	resetEmailInput.willValidate;
	resetEmailInput.required = true;
	resetEmailInput.classList.add('p-1', 'px-3', 'mb-4', 'border', 'border-gray-300', 'rounded-sm', 'w-full');
	inputAndButtonsWrapper.appendChild(resetEmailInput);

	const buttonRow = document.createElement('div');
	buttonRow.classList.add('flex', 'justify-between', 'w-full');

	const resetSubmitButton = document.createElement('button');
	resetSubmitButton.type = 'submit';
	resetSubmitButton.textContent = 'Send link';
	resetSubmitButton.classList.add('px-5', 'py-1', 'text-sm', 'bg-blue-500', 'text-white', 'rounded', 'cursor-pointer');

	const resetCancelButton = document.createElement('button');
	resetCancelButton.type = 'button';
	resetCancelButton.textContent = 'Cancel';
	resetCancelButton.classList.add('px-5', 'py-1', 'text-sm', 'bg-blue-500', 'text-white', 'rounded', 'cursor-pointer');

	buttonRow.appendChild(resetSubmitButton);
	buttonRow.appendChild(resetCancelButton);
	inputAndButtonsWrapper.appendChild(buttonRow);
	resetForm.appendChild(inputAndButtonsWrapper);
	workArea.appendChild(resetForm);

	resetForm.addEventListener('submit', formHandlers.sendLink);
	resetCancelButton.addEventListener("click", () => {
		workArea.removeChild(resetForm);
	});
}

export function resetPassword(workArea: HTMLDivElement | null) {

	// Saves to browser history
	utils.addToHistory("/reset-password");

	// Add header menu
	utils.initAppHeader();

	const passwordForm = document.createElement('form');
	passwordForm.id = 'changePassword';
	passwordForm.classList.add('w-80', 'flex', 'flex-col', 'items-center', 'mx-auto', 'my-4', 'p-4', 'bg-white', 'rounded-xl', 'shadow');

	const passwordHeading = document.createElement("p");
	passwordHeading.textContent = "Change password";
	passwordHeading.classList.add("text-1xl", "font-bold", "text-blue-600", "mb-4");
	passwordForm.appendChild(passwordHeading);

	const newPasswordContainer = document.createElement('div');
	newPasswordContainer.classList.add('relative', 'w-60', 'mb-2');

	const newPasswordInput = document.createElement('input');
	newPasswordInput.type = 'password';
	newPasswordInput.id = "newPasswordInput";
	newPasswordInput.name = 'newPassword';
	newPasswordInput.placeholder = 'Enter new password';
	newPasswordInput.minLength = 6;
	newPasswordInput.required = true;
	newPasswordInput.classList.add('w-full', 'pr-10', 'border', 'border-gray-300', 'rounded-sm', 'p-1', 'px-3');

	const newToggleButton = document.createElement('button');
	newToggleButton.type = 'button';
	newToggleButton.id = 'newToggleButton';
	newToggleButton.title = "Show password";
	newToggleButton.innerHTML = utils.eyeIcon;
	newToggleButton.className = "absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-white";
	newToggleButton.style.background = 'transparent';

	newPasswordContainer.appendChild(newPasswordInput);
	newPasswordContainer.appendChild(newToggleButton);

	const newPasswordErrorMessage = document.createElement("span");
	newPasswordErrorMessage.id = "newPasswordError";
	newPasswordErrorMessage.className = "text-red-500 text-sm ml-2 mb-2 block";

	const confirmPasswordContainer = document.createElement('div');
	confirmPasswordContainer.classList.add('relative', 'w-60', 'mb-2');

	const confirmPasswordInput = document.createElement('input');
	confirmPasswordInput.type = 'password';
	confirmPasswordInput.id = "confirmPasswordInput";
	confirmPasswordInput.name = 'confirmPassword';
	confirmPasswordInput.placeholder = 'Confirm new password';
	confirmPasswordInput.minLength = 6;
	confirmPasswordInput.required = true;
	confirmPasswordInput.classList.add('w-full', 'pr-10', 'border', 'border-gray-300', 'rounded-sm', 'p-1', 'px-3');

	const confirmToggleButton = document.createElement('button');
	confirmToggleButton.type = 'button';
	confirmToggleButton.id = 'confirmToggleButton';
	confirmToggleButton.title = "Show password";
	confirmToggleButton.innerHTML = utils.eyeIcon;
	confirmToggleButton.className = "absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-white";
	confirmToggleButton.style.background = 'transparent';

	confirmPasswordContainer.appendChild(confirmPasswordInput);
	confirmPasswordContainer.appendChild(confirmToggleButton);

	const confirmPasswordErrorMessage = document.createElement("span");
	confirmPasswordErrorMessage.id = "confirmPasswordError";
	confirmPasswordErrorMessage.className = "text-red-500 text-sm ml-2 mb-2 block";

	const passwordButtonContainer = document.createElement('div');
	passwordButtonContainer.classList.add('flex', 'justify-between', 'w-60', 'mt-2');

	const passwordSubmitButton = document.createElement('button');
	passwordSubmitButton.type = 'submit';
	passwordSubmitButton.textContent = 'Change';
	passwordSubmitButton.classList.add('px-4', 'py-1', 'text-sm', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-700');

	const passwordResetButton = document.createElement('button');
	passwordResetButton.id = 'passwordResetButton';
	passwordResetButton.type = 'button';
	passwordResetButton.textContent = 'Reset';
	passwordResetButton.classList.add('px-4', 'py-1', 'text-sm', 'bg-gray-500', 'text-white', 'rounded', 'hover:bg-gray-700');

	passwordButtonContainer.appendChild(passwordSubmitButton);
	passwordButtonContainer.appendChild(passwordResetButton);

	const passwordButtonErrorMessage = document.createElement("span");
	passwordButtonErrorMessage.id = "passwordButtonError";
	passwordButtonErrorMessage.className = "text-green-500 text-sm ml-2 mt-2 block";

	passwordForm.appendChild(newPasswordContainer);
	passwordForm.appendChild(newPasswordErrorMessage);
	passwordForm.appendChild(confirmPasswordContainer);
	passwordForm.appendChild(confirmPasswordErrorMessage);
	passwordForm.appendChild(passwordButtonContainer);
	passwordForm.appendChild(passwordButtonErrorMessage);

	workArea?.appendChild(passwordForm);

	passwordForm.addEventListener('submit', formHandlers.resetPassword);
	newToggleButton.addEventListener('click', (e: MouseEvent) => buttonHandlers.showPassword(e, newPasswordInput, newToggleButton));
	confirmToggleButton.addEventListener('click', (e: MouseEvent) => buttonHandlers.showPassword(e, confirmPasswordInput, confirmToggleButton));
	passwordResetButton.addEventListener("click", () => {
		passwordForm.reset();
	});
}

export function verify2FA(workArea: HTMLDivElement | null) {
	utils.cleanDiv(workArea);

	// Saves to browser history
	utils.addToHistory("/verify-2fa");

	// Add header menu
	utils.initAppHeader();

	const form = document.createElement('form');
	form.id = 'verify';
	//form.classList.add('flex', 'flex-col', 'items-center');
	form.classList.add('w-80', 'flex', 'flex-col', 'items-center', 'mx-auto', 'my-4', 'p-4', 'bg-white', 'rounded-xl', 'shadow');

	const codeInput = document.createElement('input');
	codeInput.type = 'number';
	codeInput.id = "codeInput";
	codeInput.name = 'code';
	codeInput.placeholder = 'Enter your code';
	codeInput.willValidate;
	codeInput.required = true;
	codeInput.classList.add('flex-1', 'p-1', 'px-3', 'border', 'border-gray-300', 'rounded-sm', 'mt-2');

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

	// Saves to browser history
	utils.addToHistory("/");

	// Add nav menu
	utils.initAppNav();

	const container = document.createElement('div');
	container.id = 'dashboardContainer';
	container.classList.add('w-100', 'flex', 'flex-col', 'items-center', 'mx-auto', 'my-4', 'p-4', 'bg-white', 'rounded-xl', 'shadow');

	// Create <h1>
	const heading = document.createElement("h1");
	heading.textContent = "Welcome to your dashboard!";
	heading.classList.add("text-3xl", "font-bold", "text-blue-600");


	container.appendChild(heading);
	workArea?.appendChild(container);
}

export async function notFound(workArea: HTMLDivElement | null) {
	utils.cleanDiv(workArea);

	// Add nav or header menu
	const isSgned = await utils.isSignedIn();
	if (isSgned)
		utils.initAppNav();
	else
		utils.initAppHeader();

	const container = document.createElement('div');
	container.id = 'notFoundContainer';
	container.classList.add('w-100', 'flex', 'flex-col', 'items-center', 'mx-auto', 'my-4', 'p-4', 'bg-white', 'rounded-xl', 'shadow');


	// Create <h1>
	const heading = document.createElement("h1");
	heading.textContent = "404";
	heading.classList.add("text-6xl", "font-bold", "text-blue-600");

	const phrase = document.createElement("p");
	phrase.textContent = "Page not found";
	phrase.classList.add("text-2xl", "font-bold", "text-blue-600");

	container.appendChild(heading);
	container.appendChild(phrase);

	workArea?.appendChild(container);
}

export function changePassword(workArea: HTMLDivElement | null) {
	const passwordForm = document.createElement('form');
	passwordForm.id = 'changePassword';
	passwordForm.classList.add('w-100', 'flex', 'flex-col', 'items-center', 'mx-auto', 'my-4', 'p-4', 'bg-white', 'rounded-xl', 'shadow');

	const passwordHeading = document.createElement("p");
	passwordHeading.textContent = "Change password";
	passwordHeading.classList.add("text-1xl", "font-bold", "text-blue-600", "mb-4");
	passwordForm.appendChild(passwordHeading);

	const oldPasswordContainer = document.createElement('div');
	oldPasswordContainer.classList.add('relative', 'w-60', 'mb-2');

	const oldPasswordInput = document.createElement('input');
	oldPasswordInput.type = 'password';
	oldPasswordInput.id = "oldPasswordInput";
	oldPasswordInput.name = 'oldPassword';
	oldPasswordInput.placeholder = 'Current password';
	oldPasswordInput.minLength = 6;
	oldPasswordInput.required = true;
	oldPasswordInput.classList.add('w-full', 'pr-10', 'border', 'border-gray-300', 'rounded-sm', 'p-1', 'px-3');

	const oldToggleButton = document.createElement('button');
	oldToggleButton.type = 'button';
	oldToggleButton.id = 'oldToggleButton';
	oldToggleButton.title = "Show password";
	oldToggleButton.innerHTML = utils.eyeIcon;
	oldToggleButton.className = "absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-white";
	oldToggleButton.style.background = 'transparent';

	oldPasswordContainer.appendChild(oldPasswordInput);
	oldPasswordContainer.appendChild(oldToggleButton);

	const oldPasswordErrorMessage = document.createElement("span");
	oldPasswordErrorMessage.id = "oldPasswordError";
	oldPasswordErrorMessage.className = "text-red-500 text-sm ml-2 mb-2 block";
	oldPasswordErrorMessage.textContent = "";

	const newPasswordContainer = document.createElement('div');
	newPasswordContainer.classList.add('relative', 'w-60', 'mb-2');

	const newPasswordInput = document.createElement('input');
	newPasswordInput.type = 'password';
	newPasswordInput.id = "newPasswordInput";
	newPasswordInput.name = 'newPassword';
	newPasswordInput.placeholder = 'Enter new password';
	newPasswordInput.minLength = 6;
	newPasswordInput.required = true;
	newPasswordInput.classList.add('w-full', 'pr-10', 'border', 'border-gray-300', 'rounded-sm', 'p-1', 'px-3');

	const newToggleButton = document.createElement('button');
	newToggleButton.type = 'button';
	newToggleButton.id = 'newToggleButton';
	newToggleButton.title = "Show password";
	newToggleButton.innerHTML = utils.eyeIcon;
	newToggleButton.className = "absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-white";
	newToggleButton.style.background = 'transparent';

	newPasswordContainer.appendChild(newPasswordInput);
	newPasswordContainer.appendChild(newToggleButton);

	const newPasswordErrorMessage = document.createElement("span");
	newPasswordErrorMessage.id = "newPasswordError";
	newPasswordErrorMessage.className = "text-red-500 text-sm ml-2 mb-2 block";
	newPasswordErrorMessage.textContent = "";

	const confirmPasswordContainer = document.createElement('div');
	confirmPasswordContainer.classList.add('relative', 'w-60', 'mb-2');

	const confirmPasswordInput = document.createElement('input');
	confirmPasswordInput.type = 'password';
	confirmPasswordInput.id = "confirmPasswordInput";
	confirmPasswordInput.name = 'confirmPassword';
	confirmPasswordInput.placeholder = 'Confirm new password';
	confirmPasswordInput.minLength = 6;
	confirmPasswordInput.required = true;
	confirmPasswordInput.classList.add('w-full', 'pr-10', 'border', 'border-gray-300', 'rounded-sm', 'p-1', 'px-3');

	const confirmToggleButton = document.createElement('button');
	confirmToggleButton.type = 'button';
	confirmToggleButton.id = 'confirmToggleButton';
	confirmToggleButton.title = "Show password";
	confirmToggleButton.innerHTML = utils.eyeIcon;
	confirmToggleButton.className = "absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-white";
	confirmToggleButton.style.background = 'transparent';

	confirmPasswordContainer.appendChild(confirmPasswordInput);
	confirmPasswordContainer.appendChild(confirmToggleButton);

	const confirmPasswordErrorMessage = document.createElement("span");
	confirmPasswordErrorMessage.id = "confirmPasswordError";
	confirmPasswordErrorMessage.className = "text-red-500 text-sm ml-2 mb-2 block";
	confirmPasswordErrorMessage.textContent = "";

	const passwordButtonContainer = document.createElement('div');
	passwordButtonContainer.classList.add('flex', 'justify-between', 'w-60', 'mt-2');

	const passwordSubmitButton = document.createElement('button');
	passwordSubmitButton.type = 'submit';
	passwordSubmitButton.textContent = 'Change';
	passwordSubmitButton.classList.add('px-4', 'py-1', 'text-sm', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-700');

	const passwordResetButton = document.createElement('button');
	passwordResetButton.id = 'passwordResetButton';
	passwordResetButton.type = 'button';
	passwordResetButton.textContent = 'Reset';
	passwordResetButton.classList.add('px-4', 'py-1', 'text-sm', 'bg-gray-500', 'text-white', 'rounded', 'hover:bg-gray-700');

	passwordButtonContainer.appendChild(passwordSubmitButton);
	passwordButtonContainer.appendChild(passwordResetButton);

	const passwordButtonErrorMessage = document.createElement("span");
	passwordButtonErrorMessage.id = "passwordButtonError";
	passwordButtonErrorMessage.className = "text-green-500 text-sm ml-2 mt-2 block";
	passwordButtonErrorMessage.textContent = "";

	passwordForm.appendChild(oldPasswordContainer);
	passwordForm.appendChild(oldPasswordErrorMessage);
	passwordForm.appendChild(newPasswordContainer);
	passwordForm.appendChild(newPasswordErrorMessage);
	passwordForm.appendChild(confirmPasswordContainer);
	passwordForm.appendChild(confirmPasswordErrorMessage);
	passwordForm.appendChild(passwordButtonContainer);
	passwordForm.appendChild(passwordButtonErrorMessage);

	workArea?.appendChild(passwordForm);

	passwordForm.addEventListener('submit', formHandlers.changePassword);
	oldToggleButton.addEventListener('click', (e: MouseEvent) => buttonHandlers.showPassword(e, oldPasswordInput, oldToggleButton));
	newToggleButton.addEventListener('click', (e: MouseEvent) => buttonHandlers.showPassword(e, newPasswordInput, newToggleButton));
	confirmToggleButton.addEventListener('click', (e: MouseEvent) => buttonHandlers.showPassword(e, confirmPasswordInput, confirmToggleButton));
	passwordResetButton.addEventListener("click", () => passwordForm.reset());
}

export function changeDisplayName(workArea: HTMLDivElement | null) {
	const nameForm = document.createElement('form');
	nameForm.id = 'changeName';
	nameForm.classList.add('w-100', 'flex', 'flex-col', 'items-center', 'mx-auto', 'my-4', 'p-4', 'bg-white', 'rounded-xl', 'shadow');

	// Unified heading
	const nameHeading = document.createElement("p");
	nameHeading.textContent = "Change display name";
	nameHeading.classList.add("text-1xl", "font-bold", "text-blue-600", "mb-4");
	nameForm.appendChild(nameHeading);

	// Input container
	const nameContainer = document.createElement('div');
	nameContainer.classList.add('relative', 'w-60', 'mb-2');

	const nameInput = document.createElement('input');
	nameInput.type = 'text';
	nameInput.id = "nameInput";
	nameInput.name = 'name';
	nameInput.placeholder = 'Enter new display name';
	nameInput.required = true;
	nameInput.classList.add('w-full', 'p-1', 'px-3', 'border', 'border-gray-300', 'rounded-sm');
	nameContainer.appendChild(nameInput);

	const nameErrorMessage = document.createElement("span");
	nameErrorMessage.id = "nameError";
	nameErrorMessage.className = "text-red-500 text-sm ml-2 mb-2 block";
	nameErrorMessage.textContent = "";

	// Buttons container
	const nameButtonContainer = document.createElement('div');
	nameButtonContainer.classList.add('flex', 'justify-between', 'w-60', 'mt-2');

	const nameSubmitButton = document.createElement('button');
	nameSubmitButton.type = 'submit';
	nameSubmitButton.textContent = 'Change';
	nameSubmitButton.classList.add('px-4', 'py-1', 'text-sm', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-700');

	const nameResetButton = document.createElement('button');
	nameResetButton.id = 'nameResetButton';
	nameResetButton.type = 'button';
	nameResetButton.textContent = 'Reset';
	nameResetButton.classList.add('px-4', 'py-1', 'text-sm', 'bg-gray-500', 'text-white', 'rounded', 'hover:bg-gray-700');

	nameButtonContainer.appendChild(nameSubmitButton);
	nameButtonContainer.appendChild(nameResetButton);

	const nameButtonErrorMessage = document.createElement("span");
	nameButtonErrorMessage.id = "nameButtonError";
	nameButtonErrorMessage.className = "text-green-500 text-sm ml-2 mt-2 block";
	nameButtonErrorMessage.textContent = "";

	nameForm.appendChild(nameContainer);
	nameForm.appendChild(nameErrorMessage);
	nameForm.appendChild(nameButtonContainer);
	nameForm.appendChild(nameButtonErrorMessage);

	workArea?.appendChild(nameForm);

	// Events
	nameForm.addEventListener('submit', formHandlers.changeDisplayName);
	nameResetButton.addEventListener("click", () => {
		nameForm.reset();
	});
}

export function manageTwoFactorAuth(workArea: HTMLDivElement | null) {
	const user2FA = localStorage.getItem('user2FA')!;

	const twoFactorForm = document.createElement('form');
	twoFactorForm.id = 'set2FA';
	twoFactorForm.classList.add('w-100', 'flex', 'flex-col', 'items-center', 'mx-auto', 'my-4', 'p-4', 'bg-white', 'rounded-xl', 'shadow');

	// Unified heading style
	const twoFactorHeading = document.createElement("p");
	twoFactorHeading.textContent = "Manage Two Factor Authentication";
	twoFactorHeading.classList.add("text-1xl", "font-bold", "text-blue-600", "mb-4");

	// Switch container
	const twoFactorContainer = document.createElement('div');
	twoFactorContainer.classList.add('flex', 'items-center', 'justify-between', 'gap-4', 'relative', 'w-60', 'mb-2');

	// Label span
	const labelSpan = document.createElement("span");
	labelSpan.id = "toggle-label";
	labelSpan.className = "text-sm font-medium text-gray-800";

	// Toggle switch wrapper
	const label = document.createElement("label");
	label.className = "relative inline-flex items-center cursor-pointer";

	// Checkbox
	const twoFactorCheckbox = document.createElement("input");
	twoFactorCheckbox.type = "checkbox";
	twoFactorCheckbox.id = "toggle";
	twoFactorCheckbox.className = "sr-only peer";

	// Track
	const track = document.createElement("div");
	track.id = "twoFactorTrack";

	// Knob
	const knob = document.createElement("div");
	knob.id = "twoFactorKnob";

	// Apply toggle state styles
	if (user2FA === 'enabled') {
		labelSpan.textContent = "Enabled";
		track.className = "w-14 h-8 bg-blue-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-500 rounded-full peer peer-checked:bg-gray-500 transition-colors duration-300";
		knob.className = "absolute right-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 transform peer-checked:-translate-x-6";
	} else {
		labelSpan.textContent = "Disabled";
		track.className = "w-14 h-8 bg-gray-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-500 rounded-full peer peer-checked:bg-blue-500 transition-colors duration-300";
		knob.className = "absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 transform peer-checked:translate-x-6";
	}

	// Error message
	const errorMessage = document.createElement("span");
	errorMessage.id = "twoFactorError";
	errorMessage.className = "text-red-500 text-sm ml-2 mt-2 block";
	errorMessage.textContent = "";

	// Build label
	label.appendChild(twoFactorCheckbox);
	label.appendChild(track);
	label.appendChild(knob);

	// Build toggle row
	twoFactorContainer.appendChild(labelSpan);
	twoFactorContainer.appendChild(label);

	// Append to form
	twoFactorForm.appendChild(twoFactorHeading);
	twoFactorForm.appendChild(twoFactorContainer);
	twoFactorForm.appendChild(errorMessage);

	// Append form to container
	workArea?.appendChild(twoFactorForm);

	// Toggle logic
	twoFactorCheckbox.addEventListener("change", (e: Event) => {
		buttonHandlers.set2FA(e, twoFactorCheckbox, labelSpan, errorMessage);
	});
}

export function accountSettings(workArea: HTMLDivElement | null) {
	utils.cleanDiv(workArea);

	// Saves to browser history
	utils.addToHistory("/settings");

	// Add nav menu
	utils.initAppNav();

	changePassword(workArea);
	changeDisplayName(workArea);
	manageTwoFactorAuth(workArea);
}

export function menu(menuArea: HTMLDivElement | null) {
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
	friendsButton.id = "friendsButton";
	friendsButton.title = "My friends";
	friendsButton.innerHTML += '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>';
	friendsButton.className = "block md:inline-block px-4 py-2 text-white hover:text-blue-800 focus:outline-none";
	menu.appendChild(friendsButton);

	const profileButton = document.createElement("button");
	profileButton.type = "button";
	profileButton.id = "profileButton";
	profileButton.title = "Profile";
	profileButton.innerHTML += `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
	profileButton.className = "block md:inline-block px-4 py-2 text-white hover:text-blue-800 focus:outline-none";
	menu.appendChild(profileButton);

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
	menu.id = "header";
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
	setActiveDM(null);

	if (!workArea)
		return;

	// Saves to browser history
	utils.addToHistory("/chat-room");

	// Add nav menu
	utils.initAppNav();

	utils.cleanDiv(workArea);

	const { userListContainer, chatContainer, messageInput, sendBtn } =
		buildChatUI(workArea);

	const users = await getUsers();

	renderUserList(users, userListContainer, display_name);
	window.addEventListener('global-presence-updated', () =>
		renderUserList(users, userListContainer, display_name)
	);

	setupGlobalChatSocket(users, userListContainer, chatContainer, userId, display_name);

	sendBtn.addEventListener('click', () =>
		sendMessage(messageInput, chatContainer, display_name)
	);

	messageInput.addEventListener('keydown', e => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage(messageInput, chatContainer, display_name);
		}
	});
}

export async function directMessagePage(
	workArea: HTMLDivElement | null,
	displayName: string, targetName: string,
	userId: string, targetId: number
) {

	if (!workArea) return;
	utils.cleanDiv(workArea);

	const {
		wrapper, banner, chatContainer,
		messageInput, sendBtn,
		addFriendBtn, viewProfileBtn,
		inviteBtn, blockBtn
	} = buildDmUI(targetName);

	workArea.append(wrapper);

	await setupDmChatControls(
		targetId,
		workArea,
		wrapper.querySelector('.card') as HTMLDivElement,
		chatContainer,
		messageInput,
		sendBtn,
		banner,
		addFriendBtn,
		viewProfileBtn,
		inviteBtn,
		blockBtn
	)

	const dmSocket = setupDmChatSocket(targetName, userId, displayName, chatContainer);

	sendBtn.addEventListener('click', () =>
		sendDmMessage(dmSocket, messageInput, chatContainer, displayName)
	)

	messageInput.addEventListener('keydown', e => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			sendDmMessage(dmSocket, messageInput, chatContainer, displayName)
		}
	})
}

export async function profile(workArea: HTMLDivElement | null, targetId: string | null) {
	if (!workArea)
		return;

	// Saves to browser history
	utils.addToHistory("/profile");

	// Add nav menu
	utils.initAppNav();

	// Saves last user viewed
	if (targetId)
		localStorage.setItem('lastTargetId', targetId)!;

	buildProfile(workArea, targetId);
}

export async function friendsList(workArea: HTMLDivElement | null) {
	if (!workArea) return
	utils.cleanDiv(workArea)

	// Saves to browser history
	utils.addToHistory("/friends");

	// Add nav menu
	utils.initAppNav();

	const { container } = await buildFriendsList(workArea);

	workArea.appendChild(container)
}

export async function tournamentsPage(workArea: HTMLDivElement | null) {
	if (!workArea)
		return;
	utils.cleanDiv(workArea);

	// Saves to browser history
	if (location.pathname !== '/game') {
		utils.addToHistory("/play");
	}

	// Add nav menu
	utils.initAppNav();

	buildTournamentsPage(workArea);
}

// TODO : - game won't present errors, but won't start
export async function gamePage(workArea: HTMLDivElement | null, matchId?: string) {
	if (!workArea)
		return;
	utils.cleanDiv(workArea);

	const { canvas, namesRow, player1_name, player2_name, player1_id, player2_id, countdownDiv } = await pongPvpMatchUI(matchId!);

	workArea.append(canvas, namesRow, countdownDiv);
	initPong(workArea, canvas, player1_name, player2_name, player1_id, player2_id, countdownDiv);
}