export function cleanDiv(divArea: HTMLDivElement | null) {
    divArea?.replaceChildren();
}