import {normName} from "./constants.js";
import {PlutoniumSource} from "./plutonium-source.js";

const BESTIARY_PAGE = "bestiary.html";

/**
 * Reuses creatures Plutonium already imported into the world, typically by an adventure import
 * (its "Creatures" folder). They carry the adventure's own art and statblocks ("Danika Dorakova"),
 * and reusing them avoids a second copy of every creature in the Actors tab.
 */
export class WorldSource {
	#edition;

	/** @param {{edition: string}} opts the rules edition to prefer ("2024" or "2014") */
	constructor ({edition}) {
		this.#edition = edition;
	}

	static #getPlutoniumActors () {
		return game.actors.filter(a => a.flags?.plutonium?.page === BESTIARY_PAGE);
	}

	/** The 5etools creatures a token stands for: the chosen edition first. */
	#getPicks (token) {
		const other = this.#edition === "2024" ? "2014" : "2024";
		return [token.creatures?.[this.#edition], token.creatures?.[other], token.creature].filter(Boolean);
	}

	static #isCreature (actor, {name, source}) {
		const flags = actor.flags.plutonium;
		const hash = globalThis.UrlUtil?.URL_TO_HASH_BUILDER?.[BESTIARY_PAGE]?.({name, source});
		if (hash && flags.hash === hash) return true;
		return flags.source?.toLowerCase() === source.toLowerCase() && normName(actor.name) === normName(name);
	}

	/** @return {Promise<?Actor>} */
	async getActor (token, {isDynamicRing = false} = {}) {
		const actors = WorldSource.#getPlutoniumActors();
		if (!actors.length) return null;
		const picks = this.#getPicks(token);

		// The exact statblock, then the same creature from another book ("Ghoul" MM vs XMM).
		// A named NPC never falls back to its generic statblock here: the next sources may have it.
		let actor = picks.map(pick => actors.find(a => WorldSource.#isCreature(a, pick))).find(Boolean);
		if (!actor && !token.npc) {
			const names = new Set([...picks.map(it => it.name), token.ddbName].filter(Boolean).map(normName));
			actor = actors.find(a => names.has(normName(a.name))) ?? null;
		}
		if (actor && isDynamicRing) await PlutoniumSource.pEnsureDynamicRing(actor);
		return actor ?? null;
	}
}
