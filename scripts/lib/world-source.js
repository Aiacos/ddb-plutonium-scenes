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

	/**
	 * The 5etools creature the token stands for in the chosen edition. Scene data generated before
	 * the edition choice existed has a single `creature`.
	 */
	#getPick (token) {
		return token.creatures?.[this.#edition] ?? token.creature ?? null;
	}

	static #isCreature (actor, {name, source}) {
		const flags = actor.flags.plutonium;
		const hash = globalThis.UrlUtil?.URL_TO_HASH_BUILDER?.[BESTIARY_PAGE]?.({name, source});
		if (hash && flags.hash === hash) return true;
		return flags.source?.toLowerCase() === source.toLowerCase() && normName(actor.name) === normName(name);
	}

	/**
	 * Only a statblock of the chosen rules edition is reused: a 2014 "Ghoul" Plutonium imported is
	 * not the 2024 one the setting asks for, and the next sources import that instead. The exact
	 * 5etools statblock comes first; then the same creature from another book of the same edition
	 * (the scene data may pick a later 2024 reprint of "Commoner" than the Monster Manual one an
	 * adventure import brought in). A named NPC only ever matches its own statblock.
	 * @return {Promise<?Actor>}
	 */
	async getActor (token, {isDynamicRing = false} = {}) {
		const pick = this.#getPick(token);
		if (!pick) return null;
		const actors = WorldSource.#getPlutoniumActors();
		const actor = actors.find(a => WorldSource.#isCreature(a, pick))
			?? (token.npc ? null : actors.find(a => normName(a.name) === normName(pick.name) && a.system?.source?.rules === this.#edition))
			?? null;
		if (actor && isDynamicRing) await PlutoniumSource.pEnsureDynamicRing(actor);
		return actor;
	}
}
