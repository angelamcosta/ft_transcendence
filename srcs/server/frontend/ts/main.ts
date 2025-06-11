import * as displayPage from './displayPage.js';

const workArea = (document.getElementById('appArea') as HTMLDivElement | null);

if (!workArea) {
  alert('No working div!');
  throw new Error('No working div!');
}

displayPage.landingPage(workArea);
