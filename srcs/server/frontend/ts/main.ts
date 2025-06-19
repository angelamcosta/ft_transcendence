import * as displayPage from './displayPage.js';
import * as buttonHandlers from './buttonHandlers.js';

async function isSignedIn() {
  try {
    const response = await fetch('/verify', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();
    console.log('API response:', data);
    if (!response.ok) {
      displayPage.header(menuArea);
      displayPage.landingPage(workArea, menuArea);
      document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
      document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
      document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
    }
    else {
      displayPage.menu(menuArea);
      displayPage.dashboard(workArea);
      document.getElementById('signOutButton')?.addEventListener("click", () => buttonHandlers.signOut(workArea));
    }
  } catch (error) {
    console.error('Error sending form data:', error);
    alert('veryfy failed! Catched on Try');
    displayPage.header(menuArea);
    displayPage.landingPage(workArea, menuArea);
    document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));
    document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));
    document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));
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

isSignedIn();

