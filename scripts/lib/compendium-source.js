import {EDITION, MODERN_PACKAGES, OFFICIAL_PACKAGE_PRIORITY, normName, warn} from "./constants.js";

const NON_CREATURE_TYPES = new Set(["character", "group", "vehicle"]);

/**
 * Supplies world actors from official D&D compendiums. Each compendium entry is imported once
 * and reused for every later token of the same creature.
 */
export class CompendiumSource {
	/** normalised name -> [{pack, entry, priority, edition}] */
	#index = null;
	/** compendium uuid -> world actor (promises dedupe concurrent imports) */
	#actors = new Map();
	#edition;

	/** @param {{edition?: string}} [opts] the rules edition to prefer ("2024" or "2014") */
	constructor ({edition = EDITION.MODERN} = {}) {
		this.#edition = edition;
	}

	static getPacks () {
		// Reuse npc-token-replacer's selection so both modules agree on what "official" means
		const fromReplacer = globalThis.NPCTokenReplacer?.getEnabledCompendiums?.();
		if (fromReplacer?.length) return [...fromReplacer];
		return game.packs.filter(pack => pack.documentName === "Actor" && pack.metadata.packageName in OFFICIAL_PACKAGE_PRIORITY);
	}

	static #getPriority (pack) {
		return OFFICIAL_PACKAGE_PRIORITY[pack.metadata.packageName] ?? 2;
	}

	/** dnd5e statblocks record their rules version; fall back to what the pack is known to contain. */
	static #getEdition (pack, entry) {
		const rules = foundry.utils.getProperty(entry, "system.source.rules");
		if (rules === EDITION.MODERN || rules === EDITION.LEGACY) return rules;
		const {packageName, name} = pack.metadata;
		if (MODERN_PACKAGES.has(packageName)) return EDITION.MODERN;
		if (packageName === "dnd5e") return name.endsWith("24") ? EDITION.MODERN : EDITION.LEGACY;
		return null;
	}

	async #getIndex () {
		if (this.#index) return this.#index;
		const index = new Map();
		for (const pack of CompendiumSource.getPacks()) {
			let entries;
			try {
				entries = await pack.getIndex({fields: ["type", "system.source.rules"]});
			} catch (e) {
				warn(`Could not index compendium ${pack.collection}`, e);
				continue;
			}
			const priority = CompendiumSource.#getPriority(pack);
			for (const entry of entries) {
				if (entry.type && NON_CREATURE_TYPES.has(entry.type)) continue;
				const k = normName(entry.name);
				if (!index.has(k)) index.set(k, []);
				index.get(k).push({pack, entry, priority, edition: CompendiumSource.#getEdition(pack, entry)});
			}
		}
		this.#index = index;
		return index;
	}

	/**
	 * Names to try for a token, most specific for the edition first. The 2024 name comes from the
	 * scene data (2014 "Goblin" -> 2024 "Goblin Warrior"); the DDB name is the 2014 one.
	 */
	#getNames (token, {isStrict}) {
		const isModern = this.#edition === EDITION.MODERN;
		const fromData = token.creatures?.[this.#edition]?.name ?? token.creature?.name;
		// A named adventure NPC ("Danika Dorakova", placed by DDB as a Commoner): only its own statblock
		if (isStrict && token.npc) return [fromData].filter(Boolean);
		return [...new Set([
			...(isModern ? [fromData] : []),
			token.ddbName,
			token.name,
			...(isModern ? [] : [fromData]),
		].filter(Boolean))];
	}

	/** Best hit for a name: the chosen edition first, then the more specific package. */
	#getBest (hits) {
		if (!hits?.length) return null;
		const score = hit => (hit.edition === this.#edition ? 100 : 0) + hit.priority;
		return [...hits].sort((a, b) => score(b) - score(a))[0];
	}

	/**
	 * @param {{folder?: Folder, isDynamicRing?: boolean, isStrict?: boolean}} opts `isStrict` skips the
	 * generic statblock of a named NPC, so another source can supply the NPC's own
	 * @return {Promise<?Actor>}
	 */
	async getActor (token, {folder, isDynamicRing = false, isStrict = false}) {
		const index = await this.#getIndex();
		const bests = this.#getNames(token, {isStrict}).map(name => this.#getBest(index.get(normName(name)))).filter(Boolean);
		// A name with a statblock in the chosen edition beats an earlier name without one
		const hit = bests.find(it => it.edition === this.#edition) ?? bests[0];
		if (!hit) return null;

		const uuid = hit.entry.uuid ?? `Compendium.${hit.pack.collection}.Actor.${hit.entry._id}`;
		if (!this.#actors.has(uuid)) this.#actors.set(uuid, this.#pGetOrImport({uuid, hit, folder, isDynamicRing}));
		return this.#actors.get(uuid);
	}

	async #pGetOrImport ({uuid, hit, folder, isDynamicRing}) {
		const existing = game.actors.find(a => a._stats?.compendiumSource === uuid || a.getFlag("core", "sourceId") === uuid);
		if (existing) return existing;

		const doc = await hit.pack.getDocument(hit.entry._id);
		// Not `importFromCompendium`: it activates the Actors sidebar tab on every import
		const data = game.actors.fromCompendium(doc);
		data.folder = folder?.id ?? null;
		if (isDynamicRing) CompendiumSource.#enableDynamicRing(data);
		return Actor.implementation.create(data);
	}

	/** Ring the compendium token art, unless the entry already sets up its own ring. */
	static #enableDynamicRing (data) {
		const proto = data.prototypeToken ??= {};
		if (proto.ring?.enabled) return;
		proto.ring = {...proto.ring, enabled: true};
		if (!proto.ring.subject?.texture && proto.texture?.src) proto.ring.subject = {...proto.ring.subject, texture: proto.texture.src};
	}
}
