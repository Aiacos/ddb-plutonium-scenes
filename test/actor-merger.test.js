import {test} from "node:test";
import assert from "node:assert/strict";
import {planMerges} from "../scripts/lib/actor-merger.js";

test("merges a compendium copy into Plutonium's actor of the same name", () => {
	const merges = planMerges({
		ours: [{id: "a1", name: "Ghoul", hash: null}],
		plutonium: [{id: "p1", name: "Ghoul", hash: "ghoul_xmm"}, {id: "p2", name: "Ghast", hash: "ghast_xmm"}],
	});
	assert.deepEqual(merges, [{fromId: "a1", toId: "p1"}]);
});

test("a Plutonium copy merges by statblock, not by name", () => {
	const merges = planMerges({
		ours: [{id: "a1", name: "Ghoul", hash: "ghoul_xmm"}],
		plutonium: [{id: "a1", name: "Ghoul", hash: "ghoul_xmm"}, {id: "p1", name: "Ghoul", hash: "ghoul_mm"}, {id: "p2", name: "Ghoul", hash: "ghoul_xmm"}],
	});
	assert.deepEqual(merges, [{fromId: "a1", toId: "p2"}]);
});

test("ambiguous or unknown names are left alone", () => {
	const merges = planMerges({
		ours: [{id: "a1", name: "Commoner", hash: null}, {id: "a2", name: "Mimic", hash: null}],
		plutonium: [{id: "p1", name: "Commoner", hash: "commoner_xmm"}, {id: "p2", name: "Commoner", hash: "commoner_mm"}],
	});
	assert.deepEqual(merges, []);
});
