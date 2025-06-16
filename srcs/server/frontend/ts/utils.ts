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