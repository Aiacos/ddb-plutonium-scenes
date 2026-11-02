import {test} from "node:test";
import assert from "node:assert/strict";
import {isPersonalName} from "../scripts/lib/scene-populator.js";

const hag = {"2024": {name: "Night Hag", source: "XMM"}, "2014": {name: "Night Hag", source: "MM"}};

test("personal names on a generic statblock are kept", () => {
	assert.equal(isPersonalName({name: "Bella Sunbane", ddbName: "Night Hag (Coven Variant)", creatures: hag}), true);
	assert.equal(isPersonalName({name: "Danika Martikov", ddbName: "Commoner", creatures: {"2024": {name: "Danika Dorakova", source: "CoS"}}}), true);
});

test("a named NPC with its own statblock keeps its name", () => {
	assert.equal(isPersonalName({name: "Morgantha", ddbName: "Night Hag (Coven Variant)", npc: true, creatures: {"2024": {name: "Morgantha", source: "CoS"}}}), true);
});

test("statblock names with counters are left to token-naming modules", () => {
	assert.equal(isPersonalName({name: "Night Hag", ddbName: "Night Hag (Coven Variant)", creatures: hag}), false);
	assert.equal(isPersonalName({name: "Goblin 3", ddbName: "Goblin", creatures: {"2024": {name: "Goblin Warrior", source: "XMM"}}}), false);
	assert.equal(isPersonalName({name: "Ghoul (A)", ddbName: "Ghoul"}), false);
	assert.equal(isPersonalName({name: "Rictavio", ddbName: "Rictavio", creatures: {"2024": {name: "Rictavio", source: "CoS"}}}), false);
});

import {ScenePopulator} from "../scripts/lib/scene-populator.js";
import {installFoundryMocks} from "./helpers.js";

/** A scene whose token creation behaves like Token Mold: renames every token, returns them reordered. */
const makeScene = () => {
	const tokens = [];
	return {
		id: "s1",
		name: "Old Bonegrinder",
		tokens: Object.assign(tokens, {filter: fn => Array.prototype.filter.call(tokens, fn)}),
		flags: {},
		async createEmbeddedDocuments (_type, data) {
			const docs = data.map((d, i) => ({...d, id: `t${tokens.length + i}`, name: `Capable ${d.name} (1)`}));
			tokens.push(...docs);
			return [...docs].reverse();
		},
		async updateEmbeddedDocuments (_type, updates) {
			for (const u of updates) Object.assign(tokens.find(t => t.id === u._id), u);
		},
		async deleteEmbeddedDocuments () {},
		async setFlag (_scope, key, value) { this.flags[key] = value; },
		getFlag () { return false; },
	};
};

test("restores personal names on the right tokens when another module renames and reorders", async () => {
	installFoundryMocks();
	const scene = makeScene();
	Object.assign(globalThis.game, {
		user: {isGM: true},
		scenes: {has: () => true},
		settings: {get: () => true},
	});
	globalThis.game.folders = Object.assign([{id: "f1", type: "Actor", name: "DDB_PLUT.FolderName", folder: null}], {});
	globalThis.ChatMessage = {implementation: {create: async () => null}, getWhisperRecipients: () => []};
	const actor = name => ({name, getTokenDocument: async data => ({toObject: () => ({...data})})});
	const byDdb = {"Dretch": actor("Dretch"), "Night Hag (Coven Variant)": actor("Night Hag")};
	const sources = [Object.assign(async token => byDdb[token.ddbName], {source: "World"})];
	const data = [
		{name: "Dretch", ddbName: "Dretch", x: 0, y: 0},
		{name: "Morgantha", ddbName: "Night Hag (Coven Variant)", npc: true, x: 100, y: 0},
		{name: "Bella Sunbane", ddbName: "Night Hag (Coven Variant)", x: 200, y: 0},
	];
	scene.flags["ddb-plutonium-scenes"] = {tokens: data};
	await ScenePopulator.pPopulate(scene, {sources});
	const byX = Object.fromEntries(scene.tokens.map(t => [t.x, t.name]));
	assert.deepEqual(byX, {0: "Capable Dretch (1)", 100: "Morgantha", 200: "Bella Sunbane"});
});
