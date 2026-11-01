import {OFFICIAL_PACKAGE_PRIORITY, normName, warn} from "./constants.js";

const NON_CREATURE_TYPES = new Set(["character", "group", "vehicle"]);

/**
 * Supplies world actors from official D&D compendiums. Each compendium entry is imported once
 * and reused for every later token of the same creature.
 */
export class CompendiumSource {
	/** normalised name -> [{pack, entry, priority}], best first */
	#index = null;
	/** compendium uuid -> world actor (promises dedupe concurrent imports) */
	#actors = new Map();

	static getPacks () {
		// Reuse npc-token-replacer's selection so both modules agree on what "official" means
		const fromReplacer = globalThis.NPCTokenReplacer?.getEnabledCompendiums?.();
		if (fromReplacer?.length) return [...fromReplacer];
		return game.packs.filter(pack => pack.documentName === "Actor" && pack.metadata.packageName in OFFICIAL_PACKAGE_PRIORITY);
	}

	static #getPriority (pack) {
		return OFFICIAL_PACKAGE_PRIORITY[pack.metadata.packageName] ?? 2;
	}

	async #getIndex () {
		if (this.#index) return this.#index;
		const index = new Map();
		for (const pack of CompendiumSource.getPacks()) {
			let entries;
			try {
				entries = await pack.getIndex({fields: ["type"]});
			} catch (e) {
				warn(`Could not index compendium ${pack.collection}`, e);
				continue;
			}
			const priority = CompendiumSource.#getPriority(pack);
			for (const entry of entries) {
				if (entry.type && NON_CREATURE_TYPES.has(entry.type)) continue;
				const k = normName(entry.name);
				if (!index.has(k)) index.set(k, []);
				index.get(k).push({pack, entry, priority});
			}
		}
		for (const hits of index.values()) hits.sort((a, b) => b.priority - a.priority);
		this.#index = index;
		return index;
	}

	/** Names to try for a token: the DDB monster name, the token name, the 5etools match. */
	static #getNames (token) {
		return [token.ddbName, token.name, token.creature?.name].filter(Boolean);
	}

	/** @return {Promise<?Actor>} */
	async getActor (token, {folder}) {
		const index = await this.#getIndex();
		const hit = CompendiumSource.#getNames(token)
			.map(name => index.get(normName(name))?.[0])
			.find(Boolean);
		if (!hit) return null;

		const uuid = hit.entry.uuid ?? `Compendium.${hit.pack.collection}.Actor.${hit.entry._id}`;
		if (!this.#actors.has(uuid)) this.#actors.set(uuid, this.#pGetOrImport({uuid, hit, folder}));
		return this.#actors.get(uuid);
	}

	async #pGetOrImport ({uuid, hit, folder}) {
		const existing = game.actors.find(a => a._stats?.compendiumSource === uuid || a.getFlag("core", "sourceId") === uuid);
		if (existing) return existing;

		const doc = await hit.pack.getDocument(hit.entry._id);
		// Not `importFromCompendium`: it activates the Actors sidebar tab on every import
		const data = game.actors.fromCompendium(doc);
		data.folder = folder?.id ?? null;
		return Actor.implementation.create(data);
	}
}
