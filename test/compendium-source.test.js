import {beforeEach, test} from "node:test";
import assert from "node:assert/strict";
import {installFoundryMocks, pack} from "./helpers.js";
import {CompendiumSource} from "../scripts/lib/compendium-source.js";

const danikaToken = {name: "Danika Martikov", ddbName: "Commoner", npc: true, creatures: {"2024": {name: "Danika Dorakova", source: "CoS"}, "2014": {name: "Danika Dorakova", source: "CoS"}}};
const goblinToken = {name: "Goblin 2", ddbName: "Goblin", creatures: {"2024": {name: "Goblin Warrior", source: "XMM"}, "2014": {name: "Goblin", source: "MM"}}};

let created;
beforeEach(() => {
	installFoundryMocks({packs: [
		pack({packageName: "dnd-monster-manual", entries: [{name: "Commoner", rules: "2024"}, {name: "Goblin Warrior", rules: "2024"}]}),
		pack({packageName: "dnd5e", name: "monsters", entries: [{name: "Goblin", rules: "2014"}, {name: "Commoner", rules: "2014"}]}),
	]});
	created = [];
	globalThis.game.actors.fromCompendium = doc => ({name: doc.name, prototypeToken: {texture: {src: `${doc.name}.webp`}}});
	globalThis.Actor = {implementation: {create: async data => { created.push(data); return data; }}};
});

test("a named NPC is not replaced by its generic statblock in strict mode", async () => {
	const source = new CompendiumSource({edition: "2024"});
	assert.equal(await source.getActor(danikaToken, {isStrict: true}), null);
	assert.equal((await source.getActor(danikaToken, {})).name, "Commoner");
});

test("prefers the chosen edition's statblock", async () => {
	assert.equal((await new CompendiumSource({edition: "2024"}).getActor(goblinToken, {})).name, "Goblin Warrior");
	assert.equal((await new CompendiumSource({edition: "2014"}).getActor(goblinToken, {})).name, "Goblin");
});

test("imports each compendium entry once", async () => {
	const source = new CompendiumSource({edition: "2024"});
	await source.getActor(goblinToken, {});
	await source.getActor(goblinToken, {});
	assert.equal(created.length, 1);
});

test("rings the imported token art when asked", async () => {
	const actor = await new CompendiumSource({edition: "2024"}).getActor(goblinToken, {isDynamicRing: true});
	assert.deepEqual(actor.prototypeToken.ring, {enabled: true, subject: {texture: "Goblin Warrior.webp"}});
});
