export const MODULE_ID = 'pf2e-token-hands';
export const PATH = `modules/${MODULE_ID}`;

/**
 * Module settings for pf2e-token-hands.
 * @typedef {Object} Settings
 * @property {Object} buttonPosition - The position of the button.
 * @property {string} buttonPosition.scope - The scope of the button.
 * @property {boolean} buttonPosition.config - Whether the button is configurable.
 * @property {Object} buttonPosition.type - The type of the button.
 * @property {number} buttonPosition.default.right - The default right position of the button.
 * @property {number} buttonPosition.default.top - The default top position of the button.
 */
const settings = {
	buttonPosition: {
		scope: 'client',
		config: false,
		type: Object,
		default: {
			right: 350,
			top: 50,
		},
	},
};

/**
 * Retrieves the value of a setting.
 *
 * @param {string} name - The name of the setting.
 * @returns {*} - The value of the setting.
 */
export function getSetting(name) {
	return game.settings.get(MODULE_ID, name);
}

/**
 * Sets a module setting value.
 *
 * @param {string} name - The name of the setting.
 * @param {*} value - The value to set for the setting.
 * @returns {Promise} A Promise that resolves when the setting is successfully set.
 */
export function setSetting(name, value) {
	return game.settings.set(MODULE_ID, name, value);
}

Hooks.once('setup', () => {
	for (const [key, setting] of Object.entries(settings)) {
		game.settings.register(MODULE_ID, key, setting);
	}
});
