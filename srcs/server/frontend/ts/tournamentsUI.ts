import { gamePage } from './displayPage.js';
import * as utils from './utils.js'
import { TournamentMatch } from './utils.js';

type Action = { label: string; handler: () => void };

type BracketMatch = {
	player1: string;
	player2: string;
	score: string;
};

export function buildTournamentsLayout() {
	const container = document.createElement('div')
	container.classList.add(
		'flex', 'gap-6', 'p-6',
		'max-w-[1050px]', 'mx-auto'
	)

	const cardBase = ['bg-white', 'rounded-xl', 'p-4', 'shadow', 'flex', 'flex-col', 'gap-4']
	const left = document.createElement('div')
	left.classList.add('flex-1', 'flex', 'flex-col', 'gap-6', ...cardBase)

	const middle = document.createElement('div')
	middle.classList.add('flex-1', 'flex', 'flex-col', 'gap-6', ...cardBase)

	const right = document.createElement('div')
	right.classList.add('flex-1', 'flex', 'flex-col', 'gap-6', ...cardBase)

	container.append(left, middle, right)
	return { container, left, middle, right }
}

export function createTournamentCard(onCreate: (name: string) => Promise<void>) {
	const card = document.createElement('div');
	card.classList.add('bg-white', 'rounded-xl', 'p-4', 'shadow', 'flex', 'flex-col', 'gap-4');

	const h3 = document.createElement('h3');
	h3.textContent = 'Create Tournament';
	h3.classList.add('text-lg', 'font-semibold');
	card.append(h3);

	const input = document.createElement('input');
	input.placeholder = 'Tournament name';
	input.classList.add('flex-1', 'p-1', 'px-2', 'border', 'border-gray-300', 'rounded-sm');

	const btn = document.createElement('button');
	btn.textContent = 'Create';
	btn.classList.add('px-4', 'py-2', 'bg-blue-500', 'text-white', 'rounded', 'cursor-pointer');

	btn.addEventListener('click', async () => {
		const name = input.value.trim();
		if (!name) return;
		await onCreate(name);
		input.value = '';
	});

	const wrapper = document.createElement('div');
	wrapper.classList.add('flex', 'gap-2');
	wrapper.append(input, btn);

	card.append(wrapper);
	return card;
}

export function buildTournamentCard(
	tournament: { id: number; name: string; status: string; created_by: string; capacity: number, current_capacity: number },
	buildActions: (t: utils.Tournaments) => Action[]
) {
	const card = document.createElement('div');
	card.classList.add('flex', 'items-center', 'justify-between', 'py-2', 'border-b', 'border-gray-200');

	const info = document.createElement('div');
	info.classList.add('flex', 'flex-col');

	const name = document.createElement('span');
	name.textContent = tournament.name;
	name.classList.add('font-medium', 'text-gray-900');

	const cap = document.createElement('span');
	cap.textContent = `${tournament.current_capacity}/${tournament.capacity} players`;
	cap.classList.add('text-sm', 'text-gray-600');

	info.append(name, cap);

	const status = document.createElement('span');
	let statusClass = ['text-xs', 'font-semibold', 'uppercase', 'px-2', 'py-0.5', 'rounded-full'];
	let statusColors: string[];

	if (tournament.status === 'open') {
		status.textContent = 'Open';
		statusColors = ['bg-green-100', 'text-green-800'];
	}
	else if (tournament.status === 'in_progress') {
		status.textContent = 'In Progress';
		statusColors = ['bg-yellow-100', 'text-yellow-800'];
	}
	else {
		status.textContent = 'Finished';
		statusColors = ['bg-gray-100', 'text-gray-800'];
	}

	status.classList.add(...statusClass, ...statusColors);


	const actions = buildActions(tournament);
	const order: Record<string, number> = {
		View: 0,
		Join: 1,
		Delete: 2
	};
	actions.sort((a, b) => (order[a.label] ?? 99) - (order[b.label] ?? 99));

	const menuContainer = document.createElement('div');
	menuContainer.classList.add('relative', 'inline-block');

	const menuBtn = document.createElement('button');
	menuBtn.textContent = '⋮';
	menuBtn.classList.add('px-2', 'py-1', 'text-gray-600', 'hover:bg-gray-100', 'rounded');

	const menuList = document.createElement('div');
	menuList.classList.add(
		'absolute', 'right-0', 'mt-2',
		'bg-white', 'shadow', 'rounded', 'border', 'border-gray-200',
		'overflow-hidden', 'z-10', 'hidden'
	);

	actions.forEach(a => {
		const it = document.createElement('div');
		it.textContent = a.label;
		it.classList.add('px-4', 'py-2', 'whitespace-nowrap', 'text-gray-800', 'hover:bg-gray-100', 'cursor-pointer');
		it.addEventListener('click', () => {
			a.handler();
			menuList.classList.add('hidden');
		});
		menuList.append(it);
	});

	menuBtn.addEventListener('click', e => {
		e.stopPropagation();
		menuList.classList.toggle('hidden');
	});
	document.addEventListener('click', () => menuList.classList.add('hidden'));

	menuContainer.append(menuBtn, menuList);

	card.append(info, status, menuContainer);
	return card;
}

export function buildPlayLocalCard(
	onAI: () => void
) {
	const card = document.createElement('div');
	card.classList.add('bg-white', 'rounded-xl', 'p-4', 'shadow', 'flex', 'flex-col', 'gap-4');

	const h3 = document.createElement('h3');
	h3.textContent = 'Practice';
	h3.classList.add('text-lg', 'font-semibold');
	card.append(h3);

	const btnPractice = document.createElement('button');
	btnPractice.textContent = 'Play Practice';
	btnPractice.classList.add('px-4', 'py-2', 'bg-indigo-500', 'text-white', 'rounded', 'cursor-pointer');
	btnPractice.addEventListener('click', onAI);

	card.append(btnPractice);
	return card;
}

function createMatchCard({ player1, player2, score }: BracketMatch) {
	const card = document.createElement('div');
	card.classList.add(
		'bg-white', 'rounded-xl', 'p-4', 'shadow', 'flex', 'flex-col',
		'items-center', 'gap-2', 'min-w-[200px]'
	);

	const p1 = document.createElement('span');
	p1.textContent = player1;
	p1.classList.add('font-medium');

	const scoreEl = document.createElement('span');
	scoreEl.textContent = score || '–';
	scoreEl.classList.add('text-xl', 'font-semibold');

	const p2 = document.createElement('span');
	p2.textContent = player2;
	p2.classList.add('font-medium');

	card.append(p1, scoreEl, p2);
	return card;
}

export async function buildTournamentBrackets(t_id: number, workArea: HTMLDivElement) {
	const res = await fetch(`/tournaments/${t_id}/matches`, { credentials: 'include' });
	const { matches } = (await res.json() as { matches: TournamentMatch[] });
	const userId = localStorage.getItem('userId')!;

	if (!res.ok)
		utils.showModal('Failed loading tournament brackets');

	const semis: TournamentMatch[] = matches.filter(m => m.round === 1);
	const finals: TournamentMatch[] = matches.filter(m => m.round === 2);

	const finalMatch: TournamentMatch | undefined = finals[0];

	const container = document.createElement('div');
	container.classList.add(
		'items-start',
		'bg-white',
		'rounded-xl',
		'flex',
		'inline-flex',
		'p-6',
		'gap-6',
		'mt-6',
		'mx-auto',
		'shadow',
	);

	const row = document.createElement('div');
	row.classList.add('flex', 'gap-6');

	const semisCard = document.createElement('div');
	semisCard.classList.add('flex', 'flex-col', 'flex-1', 'gap-4');
	const semisLabel = document.createElement('h3');
	semisLabel.textContent = 'Semi-finals';
	semisLabel.classList.add('text-center', 'font-semibold', 'text-lg', 'mb-2');
	semisCard.append(semisLabel);
	for (let i = 0; i < 2; i++) {
		const m = semis[i];
		const matchCard = createMatchCard({
			player1: m?.player1 ?? 'TBD',
			player2: m?.player2 ?? 'TBD',
			score: m?.score ?? ''
		});
		if (m && m.status !== 'finished' && (m.player1_id.toString() === userId || m.player2_id.toString() === userId)) {
			const btn = document.createElement('button');
			btn.textContent = 'Start';
			btn.classList.add('mt-2', 'px-4', 'py-1', 'bg-green-500', 'text-white', 'rounded', 'w-full');
			btn.addEventListener('click', () => {
				window.history.pushState({}, '', `/game?matchId=${m.id}`);
				gamePage(workArea, String(m.id));
			});
			matchCard.append(btn);
		}
		semisCard.append(matchCard);
	}

	const finalsCard = document.createElement('div');
	finalsCard.classList.add('flex', 'flex-col', 'items-center', 'self-center', 'gap-4', 'flex-1');
	const finalsLabel = document.createElement('h4');
	finalsLabel.textContent = 'Final';
	finalsLabel.classList.add('text-center', 'font-semibold', 'text-lg', 'mb-2');
	finalsCard.append(finalsLabel);
	const matchCard = createMatchCard({
		player1: finalMatch?.player1 || 'TBD',
		player2: finalMatch?.player2 || 'TBD',
		score: finalMatch?.score ?? ''
	});

	if (finalMatch && finalMatch.status !== 'finished' && (finalMatch.player1_id.toString() === userId || finalMatch.player2_id.toString() === userId)) {
		const btn = document.createElement('button');
		btn.textContent = 'Start';
		btn.classList.add('mt-2', 'px-4', 'py-1', 'bg-green-500', 'text-white', 'rounded', 'w-full');
		btn.addEventListener('click', () => {
			window.history.pushState({}, '', `/game?matchId=${finalMatch.id}`);
			gamePage(workArea, String(finalMatch.id));
		});
		matchCard.append(btn);
	}
	finalsCard.append(matchCard);

	row.append(semisCard, finalsCard);
	container.append(row);
	return container;
}
