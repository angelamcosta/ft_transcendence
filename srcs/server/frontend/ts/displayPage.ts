import * as utils from './utils.js';
import * as formHandlers from './formHandlers.js';
import * as buttonHandlers from './buttonHandlers.js';
import { initPong } from './pong.js';

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

export function dashboard(workArea: HTMLDivElement | null) {
    utils.cleanDiv(workArea);

    // Create <h1>
    const heading = document.createElement("h1");
    heading.textContent = "Welcome to your dashboard!";
    heading.classList.add("text-3xl", "font-bold", "text-blue-600");

    workArea?.appendChild(heading);
}

export function accountSettings(workArea: HTMLDivElement | null) {
    utils.cleanDiv(workArea);

    const passwordForm = document.createElement('form');
    passwordForm.id = 'changePassword';
	passwordForm.classList.add('flex', 'flex-col', 'items-center');

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
    passwordSubmitButton.classList.add('px-4','py-2','bg-blue-500','text-white','rounded','hover:bg-blue-700');

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

    const playBtn = document.createElement('button');
    playBtn.type = "button";
    playBtn.id = "playButton";
    playBtn.title = "New Game";
    playBtn.innerHTML = '<svg class="w-6 h-6 mr-2 fill-current" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><path d="M45.563,29.174l-22-15c-0.307-0.208-0.703-0.231-1.031-0.058C22.205,14.289,22,14.629,22,15v30 c0,0.371,0.205,0.711,0.533,0.884C22.679,45.962,22.84,46,23,46c0.197,0,0.394-0.059,0.563-0.174l22-15 C45.836,30.64,46,30.331,46,30S45.836,29.36,45.563,29.174z M24,43.107V16.893L43.225,30L24,43.107z"/></svg>Play';

    playBtn.className = "block md:inline-block px-4 py-2 text-white hover:text-blue-800 focus:outline-none";

    // **listener** que chama a page do jogo
    playBtn.addEventListener('click', () => {
        gamePage(document.getElementById('appArea') as HTMLDivElement);
    });

    menu.appendChild(playBtn);
    menu.appendChild(logoutButton);

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

    inner.appendChild(logo);
    inner.appendChild(menu);
    container.appendChild(inner);
    nav.appendChild(container);

    headerArea?.appendChild(nav);
}

export function chatPage() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.error('User ID não encontrado em localStorage.');
        return;
    }
    // Contêineres já renderizados pela menu/dashboard
    const headerArea = document.getElementById('headerArea')! as HTMLDivElement;
    const appArea = document.getElementById('appArea')! as HTMLDivElement;

    // Limpa as áreas para montar o chat
    headerArea.innerHTML = '';
    appArea.innerHTML = '';

    // Container de mensagens
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chatContainer';
    Object.assign(chatContainer.style, {
        border: '1px solid #ccc',
        height: '300px',
        overflowY: 'auto',
        margin: '16px 0',
        padding: '8px',
        backgroundColor: '#fff'
    });
    appArea.appendChild(chatContainer);

    // Input e botão de envio
    const inputWrapper = document.createElement('div');
    inputWrapper.style.display = 'flex';
    inputWrapper.style.gap = '8px';

    const messageInput = document.createElement('input');
    messageInput.id = 'chatInput';
    messageInput.placeholder = 'Escreva sua mensagem…';
    messageInput.style.flex = '1';
    inputWrapper.appendChild(messageInput);

    const sendBtn = document.createElement('button');
    sendBtn.id = 'chatSendBtn';
    sendBtn.textContent = 'Enviar';
    inputWrapper.appendChild(sendBtn);

    appArea.appendChild(inputWrapper);

    // Conecta imediatamente
    const wsUrl = `wss://${window.location.hostname}:8002/api/chat`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'identify', userId }));
    };
    ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        appendMessage(msg);
    };
    ws.onerror = (err) => console.error('WebSocket error:', err);

    sendBtn.addEventListener('click', () => {
        const content = messageInput.value.trim();
        if (!content) return;
        ws.send(JSON.stringify({ type: 'message', content }));
        appendMessage({ userId, content, timestamp: Date.now() });
        messageInput.value = '';
    });

    function appendMessage(msg: { userId?: string; from?: string; content: string; timestamp: number }) {
        const line = document.createElement('div');
        const sender = msg.userId ?? msg.from ?? 'unknown';
        line.style.textAlign = sender === userId ? 'right' : 'left';
        line.textContent = `${sender}: ${msg.content}`;
        chatContainer.appendChild(line);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// TODO : - game won't present errors, but won't start
export function gamePage(workArea: HTMLDivElement | null) {
    utils.cleanDiv(workArea);

    const canvas = document.createElement('canvas');
    const appArea = document.getElementById('appArea')! as HTMLDivElement;

    canvas.id = 'pong';
    canvas.width = 600;
    canvas.height = 600;

    appArea.appendChild(canvas);

    initPong(canvas);
}