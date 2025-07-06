import * as utils from './utils.js'

type Action = { label: string; handler: () => void }

export function buildFriendsLayout() {
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

export function buildUserCard(
	title: string,
	users: utils.User[],
	buildActions: (u: utils.User) => Action[]
) {
	const card = document.createElement('div')
	card.classList.add('bg-white', 'rounded-xl', 'p-4', 'shadow', 'flex', 'flex-col', 'gap-4')

	const h3 = document.createElement('h3')
	h3.textContent = title
	h3.classList.add('text-lg', 'font-semibold')
	card.append(h3)

	if (users.length === 0) {
		const p = document.createElement('p')
		p.textContent = `No ${title.toLowerCase()}`
		p.classList.add('text-gray-500')
		card.append(p)
	} else {
		users.forEach(u => card.append(buildUserRow(u, buildActions(u))))
	}

	return card
}

function buildUserRow(user: utils.User, actions: Action[]) {
	const row = document.createElement('div')
	row.classList.add(
		'flex', 'items-center', 'justify-between',
		'py-2', 'border-b', 'border-gray-200', 'relative'
	)

	const name = document.createElement('span')
	name.textContent = user.display_name
	name.classList.add('text-gray-900')

	const menuContainer = document.createElement('div')
	menuContainer.classList.add('relative', 'inline-block')

	const menuBtn = document.createElement('button')
	menuBtn.innerHTML = '⋮'
	menuBtn.classList.add(
		'px-2', 'py-1', 'text-gray-600',
		'hover:bg-gray-100', 'rounded'
	)

	const menuList = document.createElement('div')
	menuList.classList.add(
		'absolute', 'right-0', 'mt-2',
		'bg-white', 'shadow', 'rounded', 'border', 'border-gray-200',
		'overflow-hidden', 'z-10', 'hidden'
	)

	actions.forEach(a => {
		const it = document.createElement('div')
		it.textContent = a.label
		it.classList.add('px-4', 'py-2', 'whitespace-nowrap', 'text-gray-800', 'hover:bg-gray-100', 'cursor-pointer')
		it.addEventListener('click', () => {
			a.handler()
			menuList.classList.add('hidden')
		})
		menuList.append(it)
	})

	menuBtn.addEventListener('click', e => {
		e.stopPropagation()
		menuList.classList.toggle('hidden')
	})
	document.addEventListener('click', () => menuList.classList.add('hidden'))

	menuContainer.append(menuBtn, menuList)
	row.append(name, menuContainer)
	return row
}

export function buildInviteCard(
	title: string,
	users: utils.User[],
	type: 'received' | 'sent',
	onAccept: (id: number) => Promise<void>,
	onRejectOrCancel: (id: number) => Promise<void>
) {
	const card = document.createElement('div')
	card.classList.add('bg-white', 'rounded-xl', 'p-4', 'shadow', 'flex', 'flex-col', 'gap-4')

	const h4 = document.createElement('h4')
	h4.textContent = title
	h4.classList.add('text-lg', 'font-semibold')
	card.append(h4)

	if (users.length === 0) {
		const p = document.createElement('p')
		p.textContent = `No ${title.toLowerCase()}`
		p.classList.add('text-gray-500')
		card.append(p)
	} else {
		users.forEach(u => {
			const row = document.createElement('div')
			row.classList.add('flex', 'items-center', 'justify-between', 'py-2', 'border-b', 'border-gray-200')

			const name = document.createElement('span')
			name.textContent = u.display_name
			name.classList.add('text-gray-900')

			const btns = document.createElement('div')
			btns.classList.add('flex', 'gap-2')

			if (type === 'received') {
				const accept = document.createElement('button')
				accept.textContent = 'Accept'
				accept.classList.add('px-3', 'py-1', 'bg-green-500', 'text-white', 'rounded', 'cursor-pointer', 'text-sm')
				accept.addEventListener('click', async () => { await onAccept(u.id) })

				const reject = document.createElement('button')
				reject.textContent = 'Reject'
				reject.classList.add('px-3', 'py-1', 'bg-red-500', 'text-white', 'rounded', 'cursor-pointer', 'text-sm')
				reject.addEventListener('click', async () => { await onRejectOrCancel(u.id) })

				btns.append(accept, reject)
			} else {
				const cancel = document.createElement('button')
				cancel.textContent = 'Cancel'
				cancel.classList.add('px-3', 'py-1', 'bg-yellow-500', 'text-black', 'rounded', 'cursor-pointer', 'text-sm')
				cancel.addEventListener('click', async () => { await onRejectOrCancel(u.id) })
				btns.append(cancel)
			}

			row.append(name, btns)
			card.append(row)
		})
	}

	return card
}
