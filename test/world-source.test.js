import {beforeEach, test} from "node:test";
import assert from "node:assert/strict";
import {installFoundryMocks, plutActor} from "./helpers.js";
import {WorldSource} from "../scripts/lib/world-source.js";

const ghoulXmm = plutActor({id: "p1", name: "Ghoul", source: "XMM"});
const ghoulMm = plutActor({id: "p2", name: "Ghoul", source: "MM"});
const danika = plutActor({id: "p3", name: "Danika Dorakova", source: "CoS"});

const ghoulToken = {name: "Ghoul", ddbName: "Ghoul", creatures: {"2024": {name: "Ghoul", source: "XMM"}, "2014": {name: "Ghoul", source: "MM"}}};
const danikaToken = {name: "Danika Martikov", ddbName: "Commoner", npc: true, creatures: {"2024": {name: "Danika Dorakova", source: "CoS"}, "2014": {name: "Danika Dorakova", source: "CoS"}}};

beforeEach(() => installFoundryMocks({actors: [ghoulMm, ghoulXmm, danika]}));

test("reuses the actor of the chosen edition's statblock", async () => {
	assert.equal(await new WorldSource({edition: "2024"}).getActor(ghoulToken), ghoulXmm);
	assert.equal(await new WorldSource({edition: "2014"}).getActor(ghoulToken), ghoulMm);
});

test("does not reuse another edition's statblock", async () => {
	installFoundryMocks({actors: [ghoulMm]});
	assert.equal(await new WorldSource({edition: "2024"}).getActor(ghoulToken), null);
});

test("finds a named NPC by its adventure statblock", async () => {
	assert.equal(await new WorldSource({edition: "2024"}).getActor(danikaToken), danika);
});

test("ignores tokens without 5etools data and non-Plutonium actors", async () => {
	installFoundryMocks({actors: [{id: "x", name: "Ghoul", flags: {}}]});
	assert.equal(await new WorldSource({edition: "2024"}).getActor({name: "Ghoul", ddbName: "Ghoul"}), null);
	assert.equal(await new WorldSource({edition: "2024"}).getActor(ghoulToken), null);
});

test("rings the reused actor when asked", async () => {
	const actor = await new WorldSource({edition: "2024"}).getActor(danikaToken, {isDynamicRing: true});
	assert.deepEqual(actor.updates, [{"prototypeToken.ring.enabled": true, "prototypeToken.ring.subject.texture": "Danika Dorakova.webp"}]);
});
