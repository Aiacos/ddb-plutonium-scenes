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
