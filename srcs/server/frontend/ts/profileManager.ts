
import { buildAvatarSection, buildHistoryTable, buildInfoCard, buildProfileLayout, buildStatsSection, Match } from './profileUI.js';
import * as utils from './utils.js';

export async function buildProfile(
	workArea: HTMLDivElement,
	targetId: string | null
) {
	utils.cleanDiv(workArea);
	const userId = localStorage.getItem('userId')!;
	const viewerId = targetId ?? userId;
	const isSelf = viewerId === userId;

	const [{ display_name, email }, history, tournamentWins] = await Promise.all([
		fetch(`/users/${viewerId}`, { credentials: 'include' }).then(r => r.json()),
		fetch(`/users/${viewerId}/history`, { credentials: 'include' }).then(r => r.json()),
		fetch(`/tournaments/wins/${viewerId}`, { credentials: 'include' }).then(r => r.json())
	]);

	const t_wins = tournamentWins.wins.length;
	const wins = history.filter((m: Match) => m.winner_id === +viewerId).length;
	const losses = history.length - wins;
	const winRate = history.length ? Math.round(100 * wins / history.length) : 0;

	const { container, left, right } = buildProfileLayout();
	const infoCard = buildInfoCard(display_name, email, isSelf);
	const { card: avatarCard, uploadInput, fileNameEl, browseBtn, uploadBtn, delBtn, img } = buildAvatarSection(`/users/${viewerId}/avatar`, isSelf);
	const statsDiv = buildStatsSection(t_wins, wins, losses, winRate);
	const histTable = buildHistoryTable(history);

	async function loadAvatar() {
		const res = await fetch(`/users/${viewerId}/avatar`, { credentials: 'include' });
		if (res.ok) {
			const blob = await res.blob();
			img.src = URL.createObjectURL(blob);
		} else
			img.src = '/avatars/default.png';
	}

	if (isSelf && (uploadInput && fileNameEl && uploadBtn && browseBtn && delBtn)) {
		browseBtn.addEventListener('click', () => uploadInput.click());
		uploadBtn.addEventListener('click', async () => {
			const file = uploadInput.files?.[0];
			if (!file) return;
			const fd = new FormData();
			fd.append('avatar', file);
			const res = await fetch(`/users/${viewerId}/avatar`, {
				method: 'PUT',
				body: fd,
				credentials: 'include'
			});
			const data = await res.json();
			if (res.ok) {
				await loadAvatar();
				fileNameEl.hidden = true;
				fileNameEl.textContent = '';
				uploadBtn.disabled = true;
				uploadInput.value = '';
				utils.showModal('Avatar uploaded succesfully!');
			} else {
				fileNameEl.hidden = true;
				fileNameEl.textContent = '';
				uploadBtn.disabled = true;
				uploadInput.value = '';
				utils.showModal(data?.message);
			}
		});

		uploadInput.addEventListener('change', () => {
			const file = uploadInput.files?.[0];
			if (file) {
				fileNameEl.hidden = false;
				fileNameEl.textContent = file.name;
				uploadBtn.disabled = false;
			} else {
				fileNameEl.hidden = true;
				fileNameEl.textContent = '';
				uploadBtn.disabled = true;
			}
		});

		delBtn.addEventListener('click', async () => {
			const res = await fetch(`/users/${viewerId}/avatar`, {
				method: 'DELETE',
				credentials: 'include'
			});
			const data = await res.json();
			if (res.ok) {
				utils.showModal('Avatar deleted succesfully!');
				img.src = '/avatars/default.png';
				fileNameEl.textContent = '';
				fileNameEl.hidden = true;
			} else
				utils.showModal(data?.error);
		});
	}

	left.append(infoCard, avatarCard);
	right.append(statsDiv, histTable);
	workArea.append(container);

	container.querySelectorAll<HTMLAnchorElement>('.opp-link')
		.forEach(a => {
			a.addEventListener('click', e => {
				e.preventDefault();
				buildProfile(workArea, a.dataset.opp!);
			});
		});
}