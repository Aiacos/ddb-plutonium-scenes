import {FLAG_SCOPE, warn} from "./constants.js";

const DEFAULT_BASE_URL = "https://raw.githubusercontent.com/Aiacos/plutonium-scenes/generated";
/** "Map 3.2: Church (Player Version)", "Main Floor (Battlemap; Player Version)" */
const PLAYER_SUFFIX = /\s*\((?:(.*?);\s*)?Player Version\)$/i;

/** The DM map a player version was made from: "Map 3.2: Church", "Main Floor (Battlemap; DM Version)". */
export const getDmName = name => name.replace(PLAYER_SUFFIX, (_m, kind) => kind ? ` (${kind}; DM Version)` : "");

/**
 * Reads the scene repository Plutonium is configured with, for scenes that do not carry this
 * module's flags themselves: scenes imported before the repository had data for them, e.g. player
 * versions, which Plutonium looks up by their own name only.
 */
export class SideData {
	/** source -> Promise<?Map<name, entry>> */
	static #bySource = new Map();
	static #pIndex = null;

	static #getBaseUrl () {
		let url;
		try {
			url = game.settings.get("plutonium", "config")?.importMap?.baseSideDataUrl;
		} catch { /* Plutonium not installed */ }
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

	static isPlutoniumMap (scene) {
		const plut = scene?.flags?.plutonium;
		return plut?.page === "maps.html" && !!plut.source;
	}

	/**
	 * This module's flag data for a Plutonium-imported scene, from the scene itself or, failing
	 * that, from the scene repository entry of the scene (or, for the chapter folder only, of its
	 * DM version: creature positions are only valid on the image they were placed on).
	 * @return {Promise<?object>}
	 */
	static async pGetModuleFlags (scene) {
		const own = scene.flags?.[FLAG_SCOPE];
		if (own?.folder) return own;
		if (!this.isPlutoniumMap(scene)) return own ?? null;

		const entries = await this.#pGetEntries(scene.flags.plutonium.source);
		if (!entries) return own ?? null;
		const isPlayerVersion = PLAYER_SUFFIX.test(scene.name);
		const exact = entries.get(scene.name)?.flags?.[FLAG_SCOPE];
		if (exact) return {...exact, ...own, isPlayerVersion};
		const dm = isPlayerVersion ? entries.get(getDmName(scene.name))?.flags?.[FLAG_SCOPE] : null;
		if (!dm?.folder) return own ?? null;
		return {...own, folder: dm.folder, isPlayerVersion};
	}
}
