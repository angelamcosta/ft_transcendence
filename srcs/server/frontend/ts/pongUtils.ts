import { profile } from "./displayPage.js";

export async function postResult(
	workArea: HTMLDivElement,
	menukArea: HTMLDivElement,
	matchId: string,
	s1: number, s2: number,
	p1: string, p2: string,
) {
	const score = `${s1}-${s2}`;

	const res = await fetch(`/matches/${matchId}/result`, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			winner_id: s1 > s2 ? p1 : p2,
			score: score
		})
	})

	if (!res.ok)
		console.error('Failed to post match result');
	profile(workArea, menukArea, localStorage.getItem('userId'!));
}
