export const eyeIcon = `
		<svg class="w-5 h-5 fill-blue-500 hover:fill-blue-700" xmlns="http://www.w3.org/2000/svg" 
       		viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
       		stroke-linecap="round" stroke-linejoin="round">
    	<path d="M2.062 12.348a1 1 0 0 1 0-.696 
             10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 
             10.75 10.75 0 0 1-19.876 0"/>
    	<circle cx="12" cy="12" r="3"/>
  		</svg>`;

	export const eyeSlashIcon = `
  		<svg class="w-5 h-5 fill-blue-500 hover:fill-blue-700" xmlns="http://www.w3.org/2000/svg"
       		viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
       		stroke-linecap="round" stroke-linejoin="round">
    	<path d="M17.94 17.94A10.5 10.5 0 0 1 3 12c1.3-2.5 3.87-4.5 7-5"/>
    	<path d="M1 1l22 22"/>
  		</svg>`;

export function cleanDiv(divArea: HTMLDivElement | null) {
    divArea?.replaceChildren();
}

export function hasWhitespace(input: string): boolean {
  console.log(input);
  return /\s/.test(input);
}

export function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}