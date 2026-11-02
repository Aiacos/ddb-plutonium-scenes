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

test("edition-only lookups skip statblocks of the other edition", async () => {
	const legacyOnly = {name: "Goblin", ddbName: "Goblin", creatures: {"2014": {name: "Goblin", source: "MM"}}};
	assert.equal(await new CompendiumSource({edition: "2024"}).getActor(legacyOnly, {isEditionOnly: true}), null);
	assert.equal((await new CompendiumSource({edition: "2024"}).getActor(legacyOnly, {})).name, "Goblin");
});

test("a personal name on a generic statblock takes the official book's statblock", async () => {
	const bildrath = {name: "Bildrath", ddbName: "Commoner", creatures: {"2024": {name: "Commoner", source: "WttHC"}}};
	assert.equal((await new CompendiumSource({edition: "2024"}).getActor(bildrath, {isStrict: true, isEditionOnly: true})).name, "Commoner");
});

test("the Monster Manual wins over reprints in other official books", async () => {
	installFoundryMocks({packs: [
		pack({packageName: "dnd-dungeon-masters-guide", entries: [{name: "Wolf", rules: "2024"}]}),
		pack({packageName: "dnd-ravenloft-horrors-within", entries: [{name: "Guard", rules: "2024"}, {name: "Madam Eva", rules: "2024"}]}),
		pack({packageName: "dnd-monster-manual", entries: [{name: "Wolf", rules: "2024"}, {name: "Guard", rules: "2024"}]}),
	]});
	globalThis.game.actors.fromCompendium = doc => ({name: doc.name, uuid: doc.uuid});
	globalThis.Actor = {implementation: {create: async data => data}};
	const source = new CompendiumSource({edition: "2024"});
	const getPackage = actor => actor.uuid.split(".")[1];
	for (const name of ["Wolf", "Guard"]) {
		const actor = await source.getActor({name, ddbName: name, creatures: {"2024": {name, source: "XMM"}}}, {isStrict: true, isEditionOnly: true});
		assert.equal(getPackage(actor), "dnd-monster-manual", name);
	}
	// A creature only another book has still comes from it
	const eva = await source.getActor({name: "Madam Eva", ddbName: "Madam Eva", npc: true, creatures: {"2024": {name: "Madam Eva", source: "CoS"}}}, {isStrict: true, isEditionOnly: true});
	assert.equal(getPackage(eva), "dnd-ravenloft-horrors-within");
});
