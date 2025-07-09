export async function pongPvpMatchUI(matchId: string) {
	const res = await fetch(`/matches/${matchId}`, {
		method: 'GET',
		credentials: 'include'
	});

	const { match } = await res.json();

	const canvas = document.createElement('canvas');
	canvas.id = 'pong';
	canvas.width = 1000;
	canvas.height = 600;
	canvas.className = 'block mx-auto mt-6';

	const player1_name = match.player1_name;
	const player2_name = match.player2_name;
	const player1_id = match.player1_id;
	const player2_id = match.player2_id;

	const namesRow = document.createElement('div');
	namesRow.className = 'flex justify-between w-[1000px] mx-auto mt-2';

	const leftName = document.createElement('span');
	leftName.textContent = player1_name;
	leftName.className = 'font-bold text-xl';

	const rightName = document.createElement('span');
	rightName.textContent = player2_name;
	rightName.className = 'font-bold text-xl';

	namesRow.append(leftName, rightName);

	const countdownDiv = document.createElement('div');
	countdownDiv.id = 'redirect-countdown';
	countdownDiv.className = 'text-center mt-4 text-lg font-medium';

	return { canvas, namesRow, player1_name, player2_name, player1_id, player2_id, countdownDiv };
}