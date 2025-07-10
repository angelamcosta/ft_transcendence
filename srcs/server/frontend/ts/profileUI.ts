export interface Match {
	score: string;
	created_at: string;
	updated_at: string;
	opp_name: string;
	opp_id: number;
	winner_id: number;
	result: 'Win' | 'Defeat';
}

export function buildProfileLayout() {
	const container = document.createElement('div');
	container.classList.add('flex',
		'gap-6',
		'p-6',
		'max-w-screen-lg',
		'mx-auto'
	);

	const left = document.createElement('div');
	left.classList.add(
		'flex',
		'flex-col',
		'gap-4',
		'flex-none',
		'w-90',
		'bg-white',
		'rounded-xl',
		'p-4',
		'shadow'
	);

	const right = document.createElement('div');
	right.classList.add('flex-1',
		'bg-white',
		'rounded-xl',
		'p-4',
		'shadow',
		'flex',
		'flex-col',
		'gap-4'
	);

	container.append(left, right);
	return { container, left, right };
}

export function buildInfoCard(
	displayName: string,
	email: string | null,
	isSelf: boolean
) {
	const card = document.createElement('div');
	card.classList.add(
		'bg-white',
		'rounded-xl',
		'p-4',
		'shadow',
		'flex',
		'flex-col',
		'gap-4',
	);

	const grid = document.createElement('div');
	grid.classList.add(
		'grid',
		'grid-cols-[max-content_1fr]',
		'gap-x-4',
		'gap-y-2',
		'items-center',
		'justify-items-start'
	);

	const mkRow = (label: string, val: string) => {
		const l = document.createElement('div');
		l.classList.add(
			'text-sm',
			'font-semibold',
			'text-gray-600',
			'whitespace-nowrap'
		);
		l.textContent = label;
		const v = document.createElement('div');
		v.classList.add(
			'text-base',
			'text-gray-900',
			'truncate',
			'max-w-full',
			'justify-self-center'
		);
		v.textContent = val;
		grid.append(l, v);
	};

	mkRow('Display Name', displayName);
	if (isSelf) mkRow('Email', email!);

	card.append(grid);
	return card;
}

export function buildAvatarSection(
	avatarUrl: string,
	isSelf: boolean
) {
	const card = document.createElement('div');
	card.classList.add(
		'flex',
		'flex-col',
		'items-center',
		'gap-4',
		'p-4',
		'bg-white',
		'rounded-xl',
		'shadow'
	);

	const img = document.createElement('img');
	img.src = avatarUrl;
	img.alt = 'Avatar';
	img.classList.add(
		'w-48',
		'h-48',
		'object-cover',
		'rounded-lg',
		'border-2',
		'border-gray-300'
	);
	card.append(img);

	let browseBtn: HTMLButtonElement | undefined;
	let uploadBtn: HTMLButtonElement | undefined;
	let delBtn: HTMLButtonElement | undefined;
	let uploadInput: HTMLInputElement | undefined;
	let fileNameEl: HTMLSpanElement | undefined;

	if (isSelf) {
		const controls = document.createElement('div');
		controls.classList.add(
			'flex',
			'flex-col',
			'items-center',
			'gap-2'
		);

		const btnRow = document.createElement('div');
		btnRow.classList.add(
			'flex',
			'gap-2'
		)

		browseBtn = document.createElement('button');
		browseBtn.textContent = 'Browse…';
		browseBtn.classList.add(
			'px-4',
			'py-2',
			'bg-blue-500',
			'text-white',
			'rounded',
			'cursor-pointer'
		);
		btnRow.append(browseBtn);

		uploadBtn = document.createElement('button');
		uploadBtn.textContent = 'Upload';
		uploadBtn.disabled = true;
		uploadBtn.classList.add(
			'px-4',
			'py-2',
			'bg-green-500',
			'text-white',
			'rounded',
			'disabled:opacity-50',
			'cursor-pointer',
		);
		btnRow.append(uploadBtn);

		uploadInput = document.createElement('input');
		uploadInput.type = 'file';
		uploadInput.accept = 'image/*';
		uploadInput.style.display = 'none';

		fileNameEl = document.createElement('span');
		fileNameEl.hidden = true;
		fileNameEl.classList.add(
			'block',
			'max-w-[160px]',
			'truncate',
			'text-center',
			'text-[0.9rem]',
			'text-gray-800',
			'bg-ray-100',
			'border',
			'border-gray-300',
			'px-2',
			'py-1',
			'rounded'
		);

		delBtn = document.createElement('button');
		delBtn.textContent = 'Delete';
		delBtn.classList.add(
			'px-4',
			'py-2',
			'bg-red-500',
			'text-white',
			'rounded',
			'cursor-pointer'
		);
		controls.append(uploadInput, btnRow, fileNameEl, delBtn);
		card.append(controls);
	}

	return { card, uploadInput, fileNameEl, browseBtn, uploadBtn, delBtn, img };
}

export function buildStatsSection(
	wins: number,
	losses: number,
	winRate: number
) {
	const div = document.createElement('div');
	div.innerHTML = `
    <strong>Wins:</strong> ${wins} &nbsp;&nbsp;
    <strong>Losses:</strong> ${losses} &nbsp;&nbsp;
    <strong>Win Rate:</strong> ${winRate}%`;
	div.className = 'text-lg';
	return div;
}

export function buildHistoryTable(history: Match[]) {
	const table = document.createElement('table');
	table.classList.add(
		'w-full',
		'border-collapse',
		'history-table'
	);
	table.innerHTML = `
	<thead>
		<tr>
			<th>Date</th>
			<th>Opponent</th>
			<th>Result</th>
			<th>Score</th>
		</tr>
  	</thead>
	<tbody>
		${history.map(m => {
		const dt = new Date(m.updated_at.replace(' ', 'T') + 'Z')
			.toLocaleString('pt-PT', {
				timeZone: 'Europe/Lisbon',
				year: 'numeric', month: 'short', day: '2-digit',
				hour: '2-digit', minute: '2-digit', second: '2-digit'
			});
		return `
		<tr>
			<td>${dt}</td>
			<td>
			<a href="#" data-opp="${m.opp_id}" class="opp-link text-blue-600 hover:underline">
				${m.opp_name}
			</a>
			</td>
			<td>${m.result}</td>
			<td>${m.score || ''}</td>
		</tr>`;
	}).join('')}
	</tbody>
	`;

	return (table);
}