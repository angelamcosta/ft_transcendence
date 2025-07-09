import { initPong } from './pong.js';
import * as utils from './utils.js';
import { buildTournamentsLayout, createTournamentCard, buildTournamentCard, buildPlayLocalCard } from './tournamentsUI.js';

export async function tournamentsPage(workArea: HTMLDivElement) {
	const { container, left, middle, right } = buildTournamentsLayout();

	left.append(createTournamentCard(async name => {
		const res = await fetch('/tournaments', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		});
		const data = await res.json();
		utils.showModal(data?.message);
		loadList();
	}));

	async function loadList() {
		middle.innerHTML = '';
		const list: utils.Tournaments[] = await utils.getTournaments();

		const h3 = document.createElement('h3');
		h3.textContent = 'Tournaments';
		h3.classList.add('text-lg', 'font-semibold');
		middle.append(h3);

		const displayName = localStorage.getItem('displayName');

		if (list.length === 0) {
			const p = document.createElement('p');
			p.classList.add('text-gray-500');
			p.textContent = 'No tournaments taking place';
			middle.append(p);
		} else {
			list.forEach((t: utils.Tournaments) => {
				middle.append(buildTournamentCard(t, tournament => {
					const actions = [
						{
							label: 'View',
							handler: () => { }
						}
					];

					if (tournament.created_by === displayName) {
						actions.unshift({
							label: 'Delete',
							handler: async () => {
								const res = await fetch(`/tournaments/${t.id}`, {
									method: 'DELETE', credentials: 'include'
								});
								const data = await res.json();
								utils.showModal(data?.message);
								loadList();
							}
						});
					}

					if (tournament.current_capacity < 4) {
						actions.unshift({
							label: 'Join',
							handler: async () => {
								const res = await fetch(`/tournaments/${t.id}/players`, {
									method: 'POST', credentials: 'include'
								});
								const data = await res.json();
								utils.showModal(data?.message);
								loadList();
							}
						});
					}
					return actions;
				}));
			});
		}
	}

	right.append(buildPlayLocalCard(
		() => startAIGame(workArea)
	));

	await loadList();

	workArea.append(container);
}

export function startAIGame(workArea: HTMLDivElement | null) {
	if (!workArea)
		return;
	utils.cleanDiv(workArea)
	const canvas = document.createElement('canvas');

	canvas.id = 'pong';
	canvas.width = 1000;
	canvas.height = 600;
	canvas.style.display = 'block';
	canvas.style.margin = '0 auto';
	canvas.style.marginTop = '24px';

	workArea.appendChild(canvas);

	initPong(canvas);
}