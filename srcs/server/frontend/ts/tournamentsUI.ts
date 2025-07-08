import * as utils from './utils.js'

type Action = { label: string; handler: () => void };

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

	buildActions(tournament).forEach(a => {
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

	card.append(info, menuContainer);
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

	const btnAI = document.createElement('button');
	btnAI.textContent = 'Play VS AI';
	btnAI.classList.add('px-4', 'py-2', 'bg-indigo-500', 'text-white', 'rounded', 'cursor-pointer');
	btnAI.addEventListener('click', onAI);

	card.append(btnAI);
	return card;
}