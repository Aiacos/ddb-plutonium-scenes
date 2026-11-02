import {FLAG_SCOPE, MODULE_ID, MONSTER_SOURCE, getLoadedVersion, log, normName} from "./constants.js";
import {CompendiumSource} from "./compendium-source.js";
import {PlutoniumSource} from "./plutonium-source.js";
import {SideData} from "./side-data.js";
import {WorldSource} from "./world-source.js";

const escapeHtml = str => String(str ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"})[c]);

/** Tokens are created in batches, so a long import shows up on the scene as it goes. */
const BATCH_SIZE = 10;

/**
 * Whether DDB gave the token a personal name ("Bella Sunbane" on a Night Hag), rather than its
 * statblock's name with a counter ("Goblin 3"). Token-naming modules such as Token Mold rename new
 * tokens; personal names are restored after them.
 */
export const isPersonalName = token => {
	// The book's own named NPC ("Morgantha") keeps its name too
	if (token.npc) return true;
	const base = normName(String(token.name ?? "").replace(/\s*(\(.*?\)|#?\d+)$/, ""));
	if (!base) return false;
	const generic = [token.ddbName, token.creatures?.["2024"]?.name, token.creatures?.["2014"]?.name, token.creature?.name];
	return !generic.filter(Boolean).map(normName).includes(base);
};

/** Labels a source for the chat report: where each placed creature came from. */
const labelled = (source, fn) => Object.assign(fn, {source});

export class ScenePopulator {
	static #running = new Set();

	static getTokenData (scene) {
		// Read directly: the data is written by Plutonium from the scene repository, and
		// `getFlag` throws for a scope that is not an active package
		return scene?.flags?.[FLAG_SCOPE]?.tokens ?? [];
	}

	static hasTokenData (scene) { return this.getTokenData(scene).length > 0; }

	/** Also covers scenes imported before the scene repository had creatures for them. */
	static async pGetTokenData (scene) {
		const own = this.getTokenData(scene);
		if (own.length) return own;
		return (await SideData.pGetModuleFlags(scene))?.tokens ?? [];
	}

	/** Whether the scene may have creatures to place, without fetching the scene repository. */
	static mayHaveTokenData (scene) { return this.hasTokenData(scene) || SideData.isPlutoniumMap(scene); }

	static isPopulated (scene) { return !!scene?.getFlag(MODULE_ID, "populated"); }

	/** This module's top-level actor folder, if it exists. */
	static findFolder () {
		const name = game.i18n.localize("DDB_PLUT.FolderName");
		return game.folders.find(f => f.type === "Actor" && f.name === name && !f.folder) ?? null;
	}

	static async #pGetFolder () {
		return this.findFolder() ?? Folder.implementation.create({name: game.i18n.localize("DDB_PLUT.FolderName"), type: "Actor"});
	}

	/**
	 * The actor lookups to try for each token, in order. Reuse one set across several scenes: each
	 * source indexes compendiums and imports every creature once.
	 * @return {Array<(token, opts) => Promise<?Actor>>}
	 */
	static createSources () {
		const mode = game.settings.get(MODULE_ID, "monsterSource");
		const isFallback = game.settings.get(MODULE_ID, "fallback");
		const isDynamicRing = game.settings.get(MODULE_ID, "dynamicRing");
		const edition = game.settings.get(MODULE_ID, "edition");
		const world = new WorldSource({edition});
		const compendium = new CompendiumSource({edition});
		const plutonium = PlutoniumSource.isAvailable() ? new PlutoniumSource({edition}) : null;
		const fromWorld = labelled("World", token => world.getActor(token, {isDynamicRing}));
		const fromCompendium = labelled("Compendium", (token, opts) => compendium.getActor(token, {...opts, isDynamicRing}));
		// Named NPCs first look for their own statblock everywhere, then settle for the generic one
		const fromCompendiumStrict = labelled("Compendium", (token, opts) => compendium.getActor(token, {...opts, isDynamicRing, isStrict: true}));
		const fromPlutonium = labelled("Plutonium", token => plutonium.getActor(token, {isDynamicRing}));

		// Creatures Plutonium already imported (an adventure import) come first: same art, no duplicates
		if (mode === MONSTER_SOURCE.PLUTONIUM && plutonium) return [fromWorld, fromPlutonium, ...(isFallback ? [fromCompendium] : [])];
		if (mode === MONSTER_SOURCE.PLUTONIUM) ui.notifications.warn(game.i18n.localize("DDB_PLUT.Notify.NoPlutonium"));
		return [fromWorld, fromCompendiumStrict, ...(plutonium && isFallback ? [fromPlutonium] : []), fromCompendium];
	}

	/** @return {Promise<{actor: ?Actor, source: ?string, errors: string[]}>} */
	static async #pGetActor (token, {sources, folder}) {
		const errors = [];
		for (const getActor of sources) {
			try {
				const actor = await getActor(token, {folder});
				if (actor) return {actor, source: getActor.source ?? null, errors};
			} catch (e) {
				console.error(`${MODULE_ID} | Failed to get an actor for "${token.name}"`, e);
				errors.push(`${getActor.source ?? "?"}: ${e.message}`);
			}
		}
		return {actor: null, source: null, errors};
	}

	/** A progress-bar notification (Foundry v13+), or a plain one on older cores. */
	static #startProgress (message) {
		const notification = ui.notifications.info(message, {progress: true});
		const isProgress = typeof notification?.update === "function";
		return {
			update: (pct, msg) => { if (isProgress) notification.update({pct, message: msg}); },
			done: () => { if (isProgress) notification.update({pct: 1}); },
		};
	}

	/**
	 * Place the community monster/NPC tokens stored on a Plutonium-imported scene.
	 * @param {Scene} scene
	 * @param {{force?: boolean, sources?: Array<Function>}} [opts] `force` re-populates a scene this
	 * module already populated; `sources` shares actor lookups across scenes (see `createSources`)
	 */
	static async pPopulate (scene, {force = false, sources = null} = {}) {
		if (!game.user.isGM) return;
		const tokens = await this.pGetTokenData(scene);
		if (!tokens.length) return void ui.notifications.info(game.i18n.localize("DDB_PLUT.Notify.NoData"));
		if (this.#running.has(scene.id)) return;
		if (this.isPopulated(scene) && !force) return void ui.notifications.info(game.i18n.localize("DDB_PLUT.Notify.AlreadyPopulated"));

		this.#running.add(scene.id);
		const label = game.i18n.format("DDB_PLUT.Notify.Start", {count: tokens.length, scene: scene.name});
		const progress = this.#startProgress(label);
		try {
			// Placing again replaces what this module placed before, instead of stacking a second copy
			if (force) await this.#pRemovePlaced(scene);
			const folder = await this.#pGetFolder();
			sources ??= this.createSources();

			let placed = 0;
			let pending = [];
			const missing = new Map();
			const bySource = new Map();
			const errors = new Set();
			const isSceneAlive = () => game.scenes.has(scene.id);
			const pFlush = async () => {
				if (pending.length && isSceneAlive()) {
					const created = await scene.createEmbeddedDocuments("Token", pending.map(it => it.data));
					placed += created.length;
					// Put back personal names other modules replaced on creation. Matched by the index
					// stored on the token: other modules may skip or reorder creations.
					const wantedByIx = new Map(pending.map(it => [it.ix, it]));
					const renames = created
						.map(doc => ({doc, wanted: wantedByIx.get(doc.flags?.[MODULE_ID]?.ix)}))
						.filter(({doc, wanted}) => wanted?.isPersonal && doc.name !== wanted.data.name)
						.map(({doc, wanted}) => ({_id: doc.id, name: wanted.data.name}));
					if (renames.length) await scene.updateEmbeddedDocuments("Token", renames);
				}
				pending = [];
			};

			for (const [ix, token] of tokens.entries()) {
				// The scene may be deleted while creatures are still being imported
				if (!isSceneAlive()) return;
				const {actor, source, errors: errs} = await this.#pGetActor(token, {sources, folder});
				errs.forEach(it => errors.add(it));
				progress.update((ix + 1) / tokens.length, `${label} ${ix + 1}/${tokens.length}`);
				if (!actor) {
					missing.set(token.ddbName, (missing.get(token.ddbName) ?? 0) + 1);
					continue;
				}
				bySource.set(source, (bySource.get(source) ?? 0) + 1);
				const doc = await actor.getTokenDocument({
					name: token.name,
					x: token.x,
					y: token.y,
					elevation: token.elevation ?? 0,
					disposition: token.disposition,
					hidden: token.hidden ?? false,
					flags: {[MODULE_ID]: {ddbName: token.ddbName, ix}},
				}, {parent: scene});
				pending.push({ix, data: doc.toObject(), isPersonal: isPersonalName(token)});
				if (pending.length >= BATCH_SIZE) await pFlush();
			}
			await pFlush();
			if (!isSceneAlive()) return;

			await scene.setFlag(MODULE_ID, "populated", true);
			log(`Placed ${placed}/${tokens.length} tokens on "${scene.name}"`);
			await this.#pReport({scene, placed, total: tokens.length, missing, bySource, errors});
		} finally {
			progress.done();
			this.#running.delete(scene.id);
		}
	}

	/** Tokens this module placed carry `flags.<module>.ddbName`; tokens added by hand are kept. */
	static async #pRemovePlaced (scene) {
		const ids = scene.tokens.filter(t => t.flags?.[MODULE_ID]?.ddbName).map(t => t.id);
		if (ids.length) await scene.deleteEmbeddedDocuments("Token", ids);
	}

	static async #pReport ({scene, placed, total, missing, bySource, errors}) {
		const missingList = [...missing.entries()]
			.map(([name, n]) => `<li>${escapeHtml(name)}${n > 1 ? ` &times;${n}` : ""}</li>`)
			.join("");
		const sources = [...bySource.entries()]
			.map(([source, n]) => `${game.i18n.localize(`DDB_PLUT.Report.Source.${source}`)} ${n}`)
			.join(", ");
		const errorList = [...errors].slice(0, 5).map(e => `<li>${escapeHtml(e)}</li>`).join("");
		const version = getLoadedVersion();
		const content = `<p>${game.i18n.format("DDB_PLUT.Report.Placed", {placed, total, scene: escapeHtml(scene.name)})}</p>`
			+ (sources ? `<p>${game.i18n.localize("DDB_PLUT.Report.From")} ${sources}.</p>` : "")
			+ (missingList ? `<p>${game.i18n.localize("DDB_PLUT.Report.Missing")}</p><ul>${missingList}</ul>` : "")
			+ (errorList ? `<p>${game.i18n.localize("DDB_PLUT.Report.Errors")}</p><ul>${errorList}</ul>` : "")
			+ `<p><small>v${escapeHtml(version)}</small></p>`;
		await ChatMessage.implementation.create({content, whisper: ChatMessage.getWhisperRecipients("GM").map(u => u.id), speaker: {alias: "DDB Scenes"}});
	}
}
