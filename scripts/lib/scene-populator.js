import {FLAG_SCOPE, MODULE_ID, MONSTER_SOURCE, log} from "./constants.js";
import {CompendiumSource} from "./compendium-source.js";
import {PlutoniumSource} from "./plutonium-source.js";

const escapeHtml = str => String(str ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"})[c]);

export class ScenePopulator {
	static #running = new Set();

	static getTokenData (scene) {
		return scene?.getFlag(FLAG_SCOPE, "tokens") ?? [];
	}

	static hasTokenData (scene) { return this.getTokenData(scene).length > 0; }

	static isPopulated (scene) { return !!scene?.getFlag(MODULE_ID, "populated"); }

	static async #pGetFolder () {
		const name = game.i18n.localize("DDB_PLUT.FolderName");
		return game.folders.find(f => f.type === "Actor" && f.name === name && !f.folder)
			?? Folder.implementation.create({name, type: "Actor"});
	}

	static #getSources () {
		const mode = game.settings.get(MODULE_ID, "monsterSource");
		const isPlutonium = PlutoniumSource.isAvailable();
		const isDynamicRing = game.settings.get(MODULE_ID, "dynamicRing");
		const compendium = new CompendiumSource();
		const plutonium = isPlutonium ? new PlutoniumSource() : null;

		if (mode === MONSTER_SOURCE.PLUTONIUM && plutonium) {
			return [
				(token) => plutonium.getActor(token, {isDynamicRing}),
				...(game.settings.get(MODULE_ID, "fallback") ? [(token, opts) => compendium.getActor(token, opts)] : []),
			];
		}
		if (mode === MONSTER_SOURCE.PLUTONIUM) ui.notifications.warn(game.i18n.localize("DDB_PLUT.Notify.NoPlutonium"));
		return [
			(token, opts) => compendium.getActor(token, opts),
			...(plutonium && game.settings.get(MODULE_ID, "fallback") ? [(token) => plutonium.getActor(token, {isDynamicRing})] : []),
		];
	}

	/**
	 * Place the community monster/NPC tokens stored on a Plutonium-imported scene.
	 * @param {Scene} scene
	 * @param {{force?: boolean}} [opts] force re-populates a scene this module already populated
	 */
	static async pPopulate (scene, {force = false} = {}) {
		if (!game.user.isGM) return;
		const tokens = this.getTokenData(scene);
		if (!tokens.length) return void ui.notifications.info(game.i18n.localize("DDB_PLUT.Notify.NoData"));
		if (this.#running.has(scene.id)) return;
		if (this.isPopulated(scene) && !force) return void ui.notifications.info(game.i18n.localize("DDB_PLUT.Notify.AlreadyPopulated"));

		this.#running.add(scene.id);
		try {
			ui.notifications.info(game.i18n.format("DDB_PLUT.Notify.Start", {count: tokens.length, scene: scene.name}));
			const folder = await this.#pGetFolder();
			const sources = this.#getSources();

			const created = [];
			const missing = new Map();
			for (const [ix, token] of tokens.entries()) {
				let actor = null;
				for (const getActor of sources) {
					try {
						actor = await getActor(token, {folder});
					} catch (e) {
						console.error(`${MODULE_ID} | Failed to get an actor for "${token.name}"`, e);
					}
					if (actor) break;
				}
				if (!actor) {
					missing.set(token.ddbName, (missing.get(token.ddbName) ?? 0) + 1);
					continue;
				}
				const doc = await actor.getTokenDocument({
					name: token.name,
					x: token.x,
					y: token.y,
					elevation: token.elevation ?? 0,
					disposition: token.disposition,
					hidden: token.hidden ?? false,
					flags: {[MODULE_ID]: {ddbName: token.ddbName}},
				}, {parent: scene});
				created.push(doc.toObject());
				// Let the UI breathe during long imports
				if (ix % 10 === 9) await new Promise(resolve => setTimeout(resolve, 0));
			}

			if (created.length) await scene.createEmbeddedDocuments("Token", created);
			await scene.setFlag(MODULE_ID, "populated", true);
			log(`Placed ${created.length}/${tokens.length} tokens on "${scene.name}"`);
			await this.#pReport({scene, placed: created.length, total: tokens.length, missing});
		} finally {
			this.#running.delete(scene.id);
		}
	}

	static async #pReport ({scene, placed, total, missing}) {
		const missingList = [...missing.entries()]
			.map(([name, n]) => `<li>${escapeHtml(name)}${n > 1 ? ` &times;${n}` : ""}</li>`)
			.join("");
		const content = `<p>${game.i18n.format("DDB_PLUT.Report.Placed", {placed, total, scene: escapeHtml(scene.name)})}</p>`
			+ (missingList ? `<p>${game.i18n.localize("DDB_PLUT.Report.Missing")}</p><ul>${missingList}</ul>` : "");
		await ChatMessage.implementation.create({content, whisper: ChatMessage.getWhisperRecipients("GM").map(u => u.id), speaker: {alias: "DDB Scenes"}});
	}
}
