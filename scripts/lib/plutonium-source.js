import {warn} from "./constants.js";

/**
 * Supplies world actors by importing 5etools creatures through Plutonium's public API
 * (`game.modules.get("plutonium").api`), with the token's dynamic ring enabled.
 */
export class PlutoniumSource {
	/** "name|source" -> Promise<?Actor> */
	#actors = new Map();
	/** Plutonium's first creature import of a session caches every compendium it searches */
	static #isWarm = false;

	static isAvailable () {
		return !!game.modules.get("plutonium")?.active && !!globalThis.DataLoader && !!globalThis.UrlUtil;
	}

	static #getApi () { return game.modules.get("plutonium").api; }

	#edition;

	/** @param {{edition: string}} opts the rules edition whose statblock to import ("2024" or "2014") */
	constructor ({edition}) {
		this.#edition = edition;
	}

	/** @return {Promise<?Actor>} */
	async getActor (token, {isDynamicRing}) {
		// `creature` is the single pick of scene data generated before the edition choice existed
		const creature = token.creatures?.[this.#edition] ?? token.creature;
		if (!creature) return null;
		const key = `${creature.name}|${creature.source}`.toLowerCase();
		if (!this.#actors.has(key)) this.#actors.set(key, this.#pGetOrImport(creature, {isDynamicRing}));
		return this.#actors.get(key);
	}

	async #pGetOrImport ({name, source}, {isDynamicRing}) {
		const page = UrlUtil.PG_BESTIARY;
		const hash = UrlUtil.URL_TO_HASH_BUILDER[page]({name, source});

		let actor = game.actors.find(a => {
			const flags = a.flags?.plutonium;
			return flags?.page === page && flags?.hash === hash;
		});

		if (!actor) {
			const entry = await DataLoader.pCacheAndGet(page, source, hash);
			if (!entry) {
				warn(`5etools has no creature "${name}" (${source})`);
				return null;
			}
			if (!PlutoniumSource.#isWarm) {
				PlutoniumSource.#isWarm = true;
				ui.notifications.info(game.i18n.localize("DDB_PLUT.Notify.PlutoniumWarmup"));
			}
			const summary = await PlutoniumSource.#getApi().importer.creature.pImportEntry(entry);
			actor = summary?.imported?.find(it => it.document instanceof Actor)?.document ?? null;
			if (!actor) return null;
		}

		if (isDynamicRing) await PlutoniumSource.#pEnsureDynamicRing(actor);
		return actor;
	}

	/**
	 * Plutonium enables the ring itself when it has a "subject" image for the creature
	 * (`importCreature.isEnableDynamicRing`). For the rest, ring the existing token art.
	 */
	static async #pEnsureDynamicRing (actor) {
		const proto = actor.prototypeToken;
		if (proto.ring?.enabled) return;
		await actor.update({
			"prototypeToken.ring.enabled": true,
			...(proto.ring?.subject?.texture ? {} : {"prototypeToken.ring.subject.texture": proto.texture.src}),
		});
	}
}
