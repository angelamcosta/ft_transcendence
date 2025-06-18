import * as displayPage from './displayPage.js';

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

displayPage.header(menuArea);

displayPage.landingPage(workArea, menuArea);

document.getElementById('landButton')?.addEventListener("click", () => displayPage.landingPage(workArea, menuArea));

document.getElementById('signInButton')?.addEventListener("click", () => displayPage.signIn(workArea));

document.getElementById('signUpButton')?.addEventListener("click", () => displayPage.signUp(workArea, menuArea));