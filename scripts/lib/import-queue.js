import {MODULE_ID} from "./constants.js";
import {SceneOrganizer} from "./scene-organizer.js";
import {ScenePopulator} from "./scene-populator.js";

/** Plutonium creates an adventure's scenes a second or two apart; this much silence ends the import. */
const QUIET_MS = 5000;

/**
 * Handles the scenes of a Plutonium import once the import has finished, instead of while it runs:
 * an adventure brings dozens of scenes, and placing creatures in parallel with them competes for
 * Plutonium's own importers (whose first creature import caches every compendium, which can take
 * minutes). Scenes are filed into chapter folders first (fast), then populated one at a time with a
 * shared set of actor sources, so each creature is looked up and imported once.
 */
export class ImportQueue {
	static #pending = [];
	static #timer = null;
	static #pRunning = null;

	static add (scene) {
		this.#pending.push(scene.id);
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => this.#pRun(), QUIET_MS);
	}

	static async #pRun () {
		// A new batch that arrives mid-run waits for this one
		if (this.#pRunning) return void this.#pRunning.then(() => this.#pending.length && this.#pRun());
		const ids = [...new Set(this.#pending.splice(0))];
		this.#pRunning = this.#pProcess(ids)
			.catch(e => console.error(`${MODULE_ID} | Processing imported scenes failed`, e))
			.finally(() => { this.#pRunning = null; });
		return this.#pRunning;
	}

	static async #pProcess (ids) {
		const scenes = ids.map(id => game.scenes.get(id)).filter(Boolean);

		if (game.settings.get(MODULE_ID, "chapterFolders")) {
			const emptied = new Set();
			for (const scene of scenes) await SceneOrganizer.pOrganize(scene, {emptied});
			await SceneOrganizer.pDeleteEmpty(emptied);
		}

		if (!game.settings.get(MODULE_ID, "autoPopulate")) return;
		const toPopulate = [];
		for (const scene of scenes) {
			if (ScenePopulator.isPopulated(scene) || !ScenePopulator.mayHaveTokenData(scene)) continue;
			if ((await ScenePopulator.pGetTokenData(scene)).length) toPopulate.push(scene);
		}
		if (!toPopulate.length) return;
		if (toPopulate.length > 1) {
			ui.notifications.info(game.i18n.format("DDB_PLUT.Notify.Queue", {count: toPopulate.length}));
		}
		const sources = ScenePopulator.createSources();
		for (const scene of toPopulate) {
			if (!game.scenes.has(scene.id)) continue;
			await ScenePopulator.pPopulate(scene, {sources});
		}
	}
}
