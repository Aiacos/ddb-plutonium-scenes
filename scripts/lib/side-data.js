import {FLAG_SCOPE, warn} from "./constants.js";

const DEFAULT_BASE_URL = "https://raw.githubusercontent.com/Aiacos/plutonium-scenes/generated";
const PLAYER_SUFFIX = /\s*\(Player Version\)$/i;

/**
 * Reads the scene repository Plutonium is configured with, for scenes that do not carry this
 * module's flags themselves. Plutonium looks side data up by the map's own name only, so the
 * "(Player Version)" of a map never receives the DM map's flags.
 */
export class SideData {
	/** source -> Promise<?Map<name, entry>> */
	static #bySource = new Map();
	static #pIndex = null;

	static #getBaseUrl () {
		let url;
		try {
			url = game.settings.get("plutonium", "config")?.importMap?.baseSideDataUrl;
		} catch (e) { /* Plutonium not installed */ }
		return (url || DEFAULT_BASE_URL).replace(/\/+$/, "");
	}

	static async #pFetchJson (url) {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`${response.status} for ${url}`);
		return response.json();
	}

	static #pGetEntries (source) {
		if (!this.#bySource.has(source)) {
			const base = this.#getBaseUrl();
			this.#pIndex ||= this.#pFetchJson(`${base}/data/foundry-index.json`);
			this.#bySource.set(source, this.#pIndex
				.then(index => index[source] ? this.#pFetchJson(`${base}/data/${index[source]}`) : {map: []})
				.then(json => new Map(json.map.map(entry => [entry.name, entry])))
				.catch(e => {
					warn(`Could not load scene data for ${source}`, e);
					this.#bySource.delete(source);
					this.#pIndex = null;
					return null;
				}));
		}
		return this.#bySource.get(source);
	}

	/**
	 * This module's flag data for a Plutonium-imported scene, from the scene itself or, failing
	 * that, from the scene repository entry of the scene (or of its DM version).
	 * @return {Promise<?object>}
	 */
	static async pGetModuleFlags (scene) {
		const own = scene.flags?.[FLAG_SCOPE];
		if (own?.folder) return own;

		const plut = scene.flags?.plutonium;
		if (plut?.page !== "maps.html" || !plut.source) return own ?? null;

		const entries = await this.#pGetEntries(plut.source);
		if (!entries) return own ?? null;
		const isPlayer = PLAYER_SUFFIX.test(scene.name);
		const entry = entries.get(scene.name) ?? entries.get(scene.name.replace(PLAYER_SUFFIX, ""));
		const flags = entry?.flags?.[FLAG_SCOPE];
		if (!flags) return own ?? null;
		return {...flags, ...own, isPlayerVersion: isPlayer};
	}
}
