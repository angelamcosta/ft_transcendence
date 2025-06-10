import * as utils from './utils.js';

function createMenuButton(text: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.className = "block md:inline-block px-4 py-2 text-white hover:text-blue-800 focus:outline-none";
    return button;
}

export function landingPage(workArea: HTMLDivElement | null) {
    utils.cleanDiv(workArea);

    // Create <h1>
    const heading = document.createElement("h1");
    heading.textContent = "Welcome to our Game Hub!";
    heading.classList.add("text-3xl", "font-bold", "text-blue-600");

    // Create "Sign Up" button
    const signUpButton = document.createElement("button");
    signUpButton.id = "signUp";
    signUpButton.textContent = "Sign Up";
    signUpButton.classList.add("m-4", "px-4", "py-2", "bg-blue-500", "text-white", "rounded", "hover:bg-blue-700");

    // Create <p>
    const paragraph = document.createElement("p");
    paragraph.textContent = "Already registered?"; // fixed typo
    paragraph.classList.add("text-center", "text-blue-600");

    // Create "Sign In" button
    const signInButton = document.createElement("button");
    signInButton.id = "signIn";
    signInButton.textContent = "Sign In";
    signInButton.classList.add("m-4", "px-4", "py-2", "bg-blue-700", "text-white", "rounded", "hover:bg-blue-900");

    // Append to div
    workArea?.appendChild(heading);
    workArea?.appendChild(signUpButton);
    workArea?.appendChild(paragraph);
    workArea?.appendChild(signInButton);

    signUpButton.addEventListener("click", () => signUp(workArea));
    
    signInButton.addEventListener("click", () => {
        alert("Button clicked! Test com.");
    });
}

export function signUp(workArea: HTMLDivElement | null) {
    utils.cleanDiv(workArea);

    const form = document.createElement('form');
    form.id = 'newAccount';

    // Create an email input
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.name = 'email';
    emailInput.placeholder = 'Enter your email';
    emailInput.willValidate;
    emailInput.required = true;
    emailInput.classList.add('m-4','border','border-blue-500','text-blue-700','rounded','focus:outline-none','focus:ring-2','focus:ring-blue-500');

    // Create an email input
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.name = 'password';
    passwordInput.placeholder = 'Enter your pasword';
    passwordInput.minLength = 6;
    passwordInput.required = true;
    passwordInput.classList.add('m-4','border','border-blue-500','text-blue-700','rounded','focus:outline-none','focus:ring-2','focus:ring-blue-500');

    // Create a submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Create account';
    submitButton.classList.add('m-4','px-4','py-2','bg-blue-500','text-white','rounded','hover:bg-blue-700');

    // Create a login button
    const signInButton = document.createElement('button');
    signInButton.type = 'button';
    signInButton.textContent = 'Sign In';
    signInButton.classList.add('m-4','px-4','py-2','bg-blue-700','text-white','rounded','hover:bg-blue-900');
    
    // Append elements to form

    form.appendChild(emailInput);
    form.appendChild(document.createElement('br'));
    form.appendChild(passwordInput);
    form.appendChild(document.createElement('br'));
    form.appendChild(submitButton);

    // Append form and login button to the body
    workArea?.appendChild(form);
    workArea?.appendChild(signInButton);

    // Handle form submission
    form.addEventListener('submit', async (e: Event) => {
        e.preventDefault(); // Prevent actual form submission

        // check password length
        if (!passwordInput.checkValidity()) {
        alert("Password must be at least 6 characters long.");
        return;
        }
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        emailInput.setCustomValidity('');

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                email,
                password
                }),
            });
  
            const data = await response.json();
            console.log('API response:', data);
            if (!response.ok) {
                if (response.status === 409) {
                    emailInput.setCustomValidity('This email is already in use.');
                    emailInput.reportValidity();
                }
                else {
                    alert('Login failed! with error: ' + response.status);
                }
            }
            else {
                dashboard(workArea);
            }

        } catch (error) {
            console.error('Error sending form data:', error);
            alert('Login failed! Catched on Try');
        }
  });
  signInButton.addEventListener("click", () => {
    alert("Button clicked! Test com.");
  });
}

export function dashboard(workArea: HTMLDivElement | null) {
    utils.cleanDiv(workArea);

    menu(workArea);
}

export function menu(workArea: HTMLDivElement | null) {
    const nav = document.createElement("nav");
    nav.className = "bg-blue-500 shadow-md";

    const container = document.createElement("div");
    container.className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

    const inner = document.createElement("div");
    inner.className = "flex items-center justify-between h-16";

    const logo = document.createElement("button");
    logo.type = "button";
    logo.className = "text-xl font-bold text-white hover:text-blue-800 focus:outline-none";
    logo.textContent = "Our game hub";

    const toggleButton = document.createElement("button");
    toggleButton.id = "menu-button";
    toggleButton.className = "md:hidden text-white text-2xl focus:outline-none";
    toggleButton.textContent = "☰";

    const menu = document.createElement("div");
    menu.id = "menu";
    menu.className = "hidden md:flex space-x-4";

    const mobileMenu = document.createElement("div");
    mobileMenu.id = "mobile-menu";
    mobileMenu.className = "md:hidden hidden px-4 pb-4";

    const links = ["Friends"];
    for (const text of links) {
        menu.appendChild(createMenuButton(text));
        mobileMenu.appendChild(createMenuButton(text));
    }

    const settingsButton = document.createElement("button");
    settingsButton.type = "button";
    settingsButton.title = "Account settings";
    settingsButton.innerHTML += '<svg vg class="fill-current w-8 h-8 mr-2" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M772.672 575.808V448.192l70.848-70.848a370.688 370.688 0 0 0-56.512-97.664l-96.64 25.92-110.528-63.808-25.92-96.768a374.72 374.72 0 0 0-112.832 0l-25.92 96.768-110.528 63.808-96.64-25.92c-23.68 29.44-42.816 62.4-56.576 97.664l70.848 70.848v127.616l-70.848 70.848c13.76 35.264 32.832 68.16 56.576 97.664l96.64-25.92 110.528 63.808 25.92 96.768a374.72 374.72 0 0 0 112.832 0l25.92-96.768 110.528-63.808 96.64 25.92c23.68-29.44 42.816-62.4 56.512-97.664l-70.848-70.848z m39.744 254.848l-111.232-29.824-55.424 32-29.824 111.36c-37.76 10.24-77.44 15.808-118.4 15.808-41.024 0-80.768-5.504-118.464-15.808l-29.888-111.36-55.424-32-111.168 29.824A447.552 447.552 0 0 1 64 625.472L145.472 544v-64L64 398.528A447.552 447.552 0 0 1 182.592 193.28l111.168 29.824 55.424-32 29.888-111.36A448.512 448.512 0 0 1 497.472 64c41.024 0 80.768 5.504 118.464 15.808l29.824 111.36 55.424 32 111.232-29.824c56.32 55.68 97.92 126.144 118.592 205.184L849.472 480v64l81.536 81.472a447.552 447.552 0 0 1-118.592 205.184zM497.536 627.2a115.2 115.2 0 1 0 0-230.4 115.2 115.2 0 0 0 0 230.4z m0 76.8a192 192 0 1 1 0-384 192 192 0 0 1 0 384z"/></svg>';
    settingsButton.className = "block md:inline-block px-4 py-2 text-white hover:text-blue-800 focus:outline-none";
    menu.appendChild(settingsButton);

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.title = "Logout";
    logoutButton.innerHTML += '<svg vg class="fill-current w-8 h-8 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.6053 12.9474C17.6053 16.014 15.1193 18.5 12.0526 18.5C8.986 18.5 6.5 16.014 6.5 12.9474C6.5 11.1423 7.36133 9.53838 8.69541 8.52423C9.09037 8.22399 9.36842 7.77755 9.36842 7.28142V7.28142C9.36842 6.34022 8.43174 5.69142 7.64453 6.20732C5.4497 7.64569 4 10.1272 4 12.9474C4 17.3947 7.60529 21 12.0526 21C16.5 21 20.1053 17.3947 20.1053 12.9474C20.1053 10.1272 18.6556 7.64569 16.4607 6.20732C15.6735 5.69142 14.7368 6.34022 14.7368 7.28142V7.28142C14.7368 7.77755 15.0149 8.22399 15.4099 8.52423C16.7439 9.53838 17.6053 11.1423 17.6053 12.9474Z"/><rect x="10.75" y="4" width="2.5" height="9" rx="1.25"/></svg>';
    logoutButton.className = "block md:inline-block px-4 py-2 text-white hover:text-blue-800 focus:outline-none";
    menu.appendChild(logoutButton);
    

    inner.appendChild(toggleButton);
    inner.appendChild(logo);
    inner.appendChild(menu);
    container.appendChild(inner);
    nav.appendChild(container);
    nav.appendChild(mobileMenu);

    workArea?.appendChild(nav);
}

//<svg class="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>