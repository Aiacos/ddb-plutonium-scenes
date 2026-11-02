export const MODULE_ID = "ddb-plutonium-scenes";

/** Scene flag scope written by the plutonium-scenes generator (`_node/ddb-import/build.js`). */
export const FLAG_SCOPE = "ddb-plutonium-scenes";

export const MONSTER_SOURCE = Object.freeze({
	COMPENDIUM: "compendium",
	PLUTONIUM: "plutonium",
});

/**
 * Official Wizards of the Coast packages on Foundry, and how strongly each is preferred when a
 * creature name exists in several (adventure > rulebook > SRD). Mirrors npc-token-replacer's
 * SourceDetector whitelist; that module's selection is used instead whenever it is active.
 */
export const EDITION = Object.freeze({
	MODERN: "2024",
	LEGACY: "2014",
});

/**
 * Official packages whose statblocks follow the 2024 rules, for compendium entries that do not
 * carry `system.source.rules` themselves. In the dnd5e system, `actors24` is the SRD 5.2 pack and
 * `monsters` the SRD 5.1 (2014) one.
 */
export const MODERN_PACKAGES = new Set([
	"dnd-monster-manual",
	"dnd-players-handbook",
	"dnd-dungeon-masters-guide",
	"dnd-forge-artificer",
	"dnd-arcana-unleashed",
	"dnd-adventures-faerun",
	"dnd-heroes-faerun",
	"dnd-heroes-borderlands",
	"dnd-ravenloft-horrors-within",
	"dnd-deadfall",
]);

export const OFFICIAL_PACKAGE_PRIORITY = Object.freeze({
	"dnd5e": 1,
	"dnd-tashas-cauldron": 1,
	"dnd-monster-manual": 2,
	"dnd-players-handbook": 2,
	"dnd-dungeon-masters-guide": 2,
	"dnd-forge-artificer": 3,
	"dnd-arcana-unleashed": 3,
	"dnd-phandelver-below": 4,
	"dnd-tomb-annihilation": 4,
	"dnd-adventures-faerun": 4,
	"dnd-heroes-faerun": 4,
	"dnd-heroes-borderlands": 4,
	"dnd-ravenloft-horrors-within": 4,
	"dnd-deadfall": 4,
});

export const log = (...args) => console.log(`${MODULE_ID} |`, ...args);
export const warn = (...args) => console.warn(`${MODULE_ID} |`, ...args);

/** "Goblin Boss", "goblin-boss", "Goblin  boss" -> "goblinboss" */
export const normName = str => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
