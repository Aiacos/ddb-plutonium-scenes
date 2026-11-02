import {test} from "node:test";
import assert from "node:assert/strict";
import {getDmName} from "../scripts/lib/side-data.js";

test("maps a player version to the DM map it was made from", () => {
	assert.equal(getDmName("Map 3.2: Church (Player Version)"), "Map 3.2: Church");
	assert.equal(getDmName("Main Floor (Battlemap; Player Version)"), "Main Floor (Battlemap; DM Version)");
	assert.equal(getDmName("Map 3.2: Church"), "Map 3.2: Church");
});
