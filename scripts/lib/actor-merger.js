import {MODULE_ID, log, normName} from "./constants.js";

/**
 * Pairs each actor this module imported through Plutonium with the world actor Plutonium imported
 * for the same creature: the same 5etools statblock (`hash`), otherwise the same name. Names
 * Plutonium imported more than once are ambiguous and left alone. Copies from official compendiums
 * are kept: their statblocks are preferred over Plutonium's.
 * @param {{ours: Array<{id, name, hash?, isOfficial?}>, plutonium: Array<{id, name, hash}>}} actors
 * @return {Array<{fromId: string, toId: string}>}
 */
export const planMerges = ({ours, plutonium}) => ours.flatMap(actor => {
	if (actor.isOfficial) return [];
	const others = plutonium.filter(it => it.id !== actor.id);
	const byHash = actor.hash ? others.filter(it => it.hash === actor.hash) : [];
	const matches = byHash.length ? byHash : others.filter(it => normName(it.name) === normName(actor.name));
	return matches.length === 1 ? [{fromId: actor.id, toId: matches[0].id}] : [];
});

/**
 * Earlier versions imported their own copy of creatures an adventure import had already brought in
 * through Plutonium. Moves the tokens of those copies onto Plutonium's actors and
 * deletes the copies.
 */
export class ActorMerger {
	/** @param {Folder} folder this module's actor folder */
	static async pMergeDuplicates (folder) {
		if (!game.user.isGM) return {actors: 0, tokens: 0};
		const toPlain = a => ({
			id: a.id,
			name: a.name,
			hash: a.flags?.plutonium?.hash ?? null,
			isOfficial: String(a._stats?.compendiumSource ?? a.flags?.core?.sourceId ?? "").startsWith("Compendium."),
		});
		const ours = folder ? game.actors.filter(a => a.folder?.id === folder.id) : [];
		const plutonium = game.actors.filter(a => a.flags?.plutonium?.page === "bestiary.html" && a.folder?.id !== folder?.id);
		const merges = planMerges({ours: ours.map(toPlain), plutonium: plutonium.map(toPlain)});
		if (!merges.length) {
			ui.notifications.info(game.i18n.localize("DDB_PLUT.Notify.NothingToMerge"));
			return {actors: 0, tokens: 0};
		}

		const targets = new Map(merges.map(({fromId, toId}) => [fromId, game.actors.get(toId)]));
		let tokens = 0;
		for (const scene of game.scenes) {
			const stale = scene.tokens.filter(t => targets.has(t.actorId));
			if (!stale.length) continue;
			const replacements = [];
			for (const token of stale) {
				const doc = await targets.get(token.actorId).getTokenDocument({
					name: token.name,
					x: token.x,
					y: token.y,
					elevation: token.elevation,
					disposition: token.disposition,
					hidden: token.hidden,
					flags: {[MODULE_ID]: token.flags?.[MODULE_ID] ?? {}},
				}, {parent: scene});
				replacements.push(doc.toObject());
			}
			await scene.deleteEmbeddedDocuments("Token", stale.map(t => t.id));
			await scene.createEmbeddedDocuments("Token", replacements);
			tokens += stale.length;
		}

		await Actor.implementation.deleteDocuments([...targets.keys()]);
		log(`Merged ${targets.size} duplicate actors, ${tokens} tokens moved`);
		ui.notifications.info(game.i18n.format("DDB_PLUT.Notify.Merged", {actors: targets.size, tokens}));
		return {actors: targets.size, tokens};
	}
}
