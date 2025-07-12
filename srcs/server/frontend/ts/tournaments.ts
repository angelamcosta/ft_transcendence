import { initPong } from './pong.js';
import * as utils from './utils.js';
import { buildTournamentsLayout, createTournamentCard, buildTournamentCard, buildPlayLocalCard, buildTournamentBrackets } from './tournamentsUI.js';

async function showBrackets(workArea: HTMLDivElement,  menuArea: HTMLDivElement, t_id: number) {
	utils.cleanDiv(workArea);
	const newEl = await buildTournamentBrackets(t_id, workArea, menuArea);
	workArea.append(newEl);
}

export function startPracticeGame(workArea: HTMLDivElement | null,  menuArea: HTMLDivElement | null) {
	if (!workArea ||  !menuArea)
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

	initPong(workArea, menuArea, canvas);
}

export async function buildTournamentsPage(workArea: HTMLDivElement,  menuArea: HTMLDivElement) {
	const { container, left, middle, right } = buildTournamentsLayout();

	async function loadList() {
		left.innerHTML = '';
		const list: utils.Tournaments[] = await utils.getTournaments();

		const h3 = document.createElement('h3');
		h3.textContent = 'Tournaments';
		h3.classList.add('text-lg', 'font-semibold');
		left.append(h3);

		const displayName = localStorage.getItem('displayName');

		if (list.length === 0) {
			const p = document.createElement('p');
			p.classList.add('text-gray-500');
			p.textContent = 'No tournaments taking place';
			left.append(p);
		} else {
			list.forEach((t: utils.Tournaments) => {
				left.append(buildTournamentCard(t, tournament => {
					const actions = [];

					if (tournament.current_capacity === tournament.capacity) {
						actions.unshift({
							label: 'View',
							handler: () => { showBrackets(workArea, menuArea, tournament.id); }
						})
					}

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

	middle.append(createTournamentCard(async name => {
		const res = await fetch('/tournaments', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		});
		const data = await res.json();
		await fetch(`/tournaments/${data.id}/players`, { method: 'POST', credentials: 'include' });
		utils.showModal(data?.message);
		loadList();
	}));

	right.append(buildPlayLocalCard(() => {
		window.history.replaceState({}, '', '/game');
		startPracticeGame(workArea, menuArea)
	}
	));

	await loadList();

	workArea.append(container);
}
