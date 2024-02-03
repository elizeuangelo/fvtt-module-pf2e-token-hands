import { getSetting, setSetting } from './settings.js';
import { sleep } from './utils.js';

/**
 * Calculates the coordinates of a button based on the mouse event.
 * @param {MouseEvent} ev - The mouse event object.
 * @returns {Object} - The calculated coordinates of the button.
 */
function calcButtonCoords(ev) {
	const { width } = document.body.getBoundingClientRect();
	return { right: width - ev.clientX - offset.x, top: ev.clientY - offset.y };
}

/**
 * Handles the drag start event for the screen button.
 * @param {Event} ev - The drag start event.
 */
function handleDragStart(ev) {
	const { right, top } = calcButtonCoords(ev);
	const el = $(ev.currentTarget).find('#token-hands');
	el.css('right', right);
	el.css('top', top);
}

/**
 * Handles the drag end event.
 * @param {Event} ev - The drag end event.
 */
function handleDragEnd(ev) {
	document.body.removeEventListener('pointermove', handleDragStart);
	ev.currentTarget.removeEventListener('pointerup', this);
	setSetting('buttonPosition', calcButtonCoords(ev));
}

async function handleDrop(ev) {
	const hand = ev.target.id === 'token-left-hand' ? 'left-hand' : 'right-hand';
	const actor = activeToken.actor;
	const data = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'));
	if (data.type !== 'Item') return;
	const item = await fromUuid(data.uuid);
	if (hand === 'left-hand') leftHand = item;
	else rightHand = item;
	await actor.setFlag('pf2e-token-hands', hand, data.uuid);
	updateButton(activeToken, true);
}

let button = null,
	leftHandEl = null,
	rightHandEl = null,
	leftHand = null,
	rightHand = null,
	activeToken = null,
	offset;

export async function createScreenButton() {
	button?.remove();
	const pos = getSetting('buttonPosition');
	const element = (button = $(/*html*/ `
        <div id="token-hands" style="right: ${pos.right}px; top: ${pos.top}px;">
            <div id="token-left-hand"></div>
            <div id="token-right-hand"></div>
        </div>`));

	leftHandEl = element.find('#token-left-hand');
	rightHandEl = element.find('#token-right-hand');

	element.on('pointerdown', (ev) => {
		if (ev.button !== 1) return;
		document.body.addEventListener('pointermove', handleDragStart);
		element.on('pointerup', handleDragEnd);
	});

	document.body.insertAdjacentElement('beforeend', element[0]);
	offset = {
		x: button[0].clientWidth / 2,
		y: button[0].clientHeight / 2,
	};

	button.on('drop', handleDrop);
	button.on('click', (ev) => {
		if (ev.button !== 0) return;
		const hand = ev.target.id === 'token-left-hand' ? leftHand : rightHand;
		if (!hand) return;
		hand.sheet.render(true);
	});
	button.on('contextmenu', async (ev) => {
		ev.preventDefault();
		const hand = ev.target.id === 'token-left-hand' ? 'left-hand' : 'right-hand';
		if (hand === 'left-hand') leftHand = null;
		else rightHand = null;
		await activeToken.actor.unsetFlag('pf2e-token-hands', hand);
		updateButton(activeToken, true);
	});

	updateButton();
}

/**
 * Updates the button based on the provided token and controlled status.
 * @param {Token} token - The token to update the button for.
 * @param {boolean} controlled - The controlled status of the token.
 * @returns {Promise<void>} - A promise that resolves once the button is updated.
 */
async function updateButton(token, controlled) {
	if (!button) return;
	if (controlled === false || !token) {
		button.fadeOut();
		activeToken = null;
		await sleep(400);
		$(leftHandEl, rightHandEl).addClass('empty');
		return;
	}
	activeToken = token;
	if (!token.actor) return;
	button.fadeIn();
	await sleep(400);

	leftHand = await fromUuid(token.actor.getFlag('pf2e-token-hands', 'left-hand'));
	rightHand = await fromUuid(token.actor.getFlag('pf2e-token-hands', 'right-hand'));

	leftHandEl[0].classList.toggle('empty', !leftHand);
	rightHandEl[0].classList.toggle('empty', !rightHand);

	leftHandEl[0].style.backgroundImage = leftHand?.img ? `url(${leftHand.img})` : '';
	rightHandEl[0].style.backgroundImage = rightHand?.img ? `url(${rightHand.img})` : '';

	leftHandEl[0].dataset.tooltip = leftHand?.name || 'Empty';
	rightHandEl[0].dataset.tooltip = rightHand?.name || 'Empty';
}

Hooks.once('ready', createScreenButton);
Hooks.on('controlToken', updateButton);
Hooks.on('updateActor', (actor, changes) => {
	if (actor !== game.user.character || !('flags' in changes)) return;
	updateButton();
});
