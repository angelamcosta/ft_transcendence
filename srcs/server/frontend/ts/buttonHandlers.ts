import * as utils from './utils.js';
import * as displayPage from './displayPage.js';

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
        displayPage.header(menuArea);
        displayPage.landingPage(workArea, menuArea);
        localStorage.removeItem('userId');
        document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
        document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
        document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
    } catch (error) {
        console.error('Error sending form data:', error);
        alert('Logout failed! Catched on Try');
    }
}