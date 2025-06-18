import * as utils from './utils.js';
import * as displayPage from './displayPage.js';

export async function signUp(e: Event) {
    e.preventDefault(); // Prevent actual form submission

    const workArea = (document.getElementById('appArea') as HTMLDivElement | null);
    const menuArea = (document.getElementById('headerArea') as HTMLDivElement | null);

    const form = e.target as HTMLFormElement;
    const emailInput = document.getElementById('emailInput') as HTMLInputElement;
    const nameInput = document.getElementById('nameInput') as HTMLInputElement;
    const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;

    // Check whitespaces
    emailInput.setCustomValidity('');
    nameInput.setCustomValidity('');
    passwordInput.setCustomValidity('');
    
    if (utils.hasWhitespace(nameInput.value)) {
        nameInput.setCustomValidity('Display name cannot have whitespaces.');
        nameInput.reportValidity();
        return;
    }
    nameInput.setCustomValidity('');
    
    // check password length
    if (!passwordInput.checkValidity()) {
        alert("Password must be at least 6 characters long.");
        return;
    }

    if (utils.hasWhitespace(passwordInput.value)) {
        passwordInput.setCustomValidity('Password cannot have whitespaces.');
        passwordInput.reportValidity();
        return;
    }
    passwordInput.setCustomValidity('');

    const formData = new FormData(form);
    const email = formData.get('email');
    const display_name = formData.get('name');
    const password = formData.get('password');
    
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            email,
            display_name,
            password
            }),
        });

        const data = await response.json();
        console.log('API response:', data);
        if (!response.ok) {
            const message = data?.error || 'Register failed';
    
			// Create  a message container
			let errorMessage = document.createElement('div');
			errorMessage.id = 'registerError';
			errorMessage.className = 'text-red-600 mt-2 text-sm';
			form.append(errorMessage);
			errorMessage.textContent = message;
			return;
        }
		const message = data?.success || 'Register success';
		emailInput.setCustomValidity('');
		displayPage.signIn(workArea, message);
    } catch (error) {
        console.error('Error sending form data:', error);
        alert('Register failed! Catched on Try');
    }
}

export async function signIn(e: Event) {
	e.preventDefault();

    const workArea = (document.getElementById('appArea') as HTMLDivElement | null);
    const menuArea = (document.getElementById('headerArea') as HTMLDivElement | null);

	const form = e.target as HTMLFormElement;
	const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

	try {
        const response = await fetch('/login', {
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
		if (!response.ok) {
    		const message = data?.error || 'Login failed.';
    
			// Create  a message container
			let messageDiv = document.createElement('div');
			messageDiv.id = 'loginError';
			messageDiv.className = 'text-red-600 mt-2 text-sm';
			form.append(messageDiv);
			messageDiv.textContent = message;
			return;
		}

        displayPage.menu(menuArea);
        displayPage.dashboard(workArea);
    } catch (error) {
        console.error('Error sending form data:', error);
        alert('Login failed! Catched on Try');
    }
}