import {EDITION, MODULE_ID, MONSTER_SOURCE} from "./lib/constants.js";
import {ScenePopulator} from "./lib/scene-populator.js";
import {CompendiumSource} from "./lib/compendium-source.js";
import {SceneOrganizer} from "./lib/scene-organizer.js";
import {ImportQueue} from "./lib/import-queue.js";
import {ActorMerger} from "./lib/actor-merger.js";

const registerSettings = () => {
	game.settings.register(MODULE_ID, "monsterSource", {
		name: "DDB_PLUT.Settings.MonsterSource.Name",
		hint: "DDB_PLUT.Settings.MonsterSource.Hint",
		scope: "world",
		config: true,
		type: String,
		choices: {
			[MONSTER_SOURCE.COMPENDIUM]: "DDB_PLUT.Settings.MonsterSource.Compendium",
			[MONSTER_SOURCE.PLUTONIUM]: "DDB_PLUT.Settings.MonsterSource.Plutonium",
		},
		default: MONSTER_SOURCE.COMPENDIUM,
	});
	game.settings.register(MODULE_ID, "edition", {
		name: "DDB_PLUT.Settings.Edition.Name",
		hint: "DDB_PLUT.Settings.Edition.Hint",
		scope: "world",
		config: true,
		type: String,
		choices: {
			[EDITION.MODERN]: "DDB_PLUT.Settings.Edition.Modern",
			[EDITION.LEGACY]: "DDB_PLUT.Settings.Edition.Legacy",
		},
		default: EDITION.MODERN,
	});
	game.settings.register(MODULE_ID, "fallback", {
		name: "DDB_PLUT.Settings.Fallback.Name",
		hint: "DDB_PLUT.Settings.Fallback.Hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
	});
	game.settings.register(MODULE_ID, "dynamicRing", {
		name: "DDB_PLUT.Settings.DynamicRing.Name",
		hint: "DDB_PLUT.Settings.DynamicRing.Hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
	});
	game.settings.register(MODULE_ID, "autoPopulate", {
		name: "DDB_PLUT.Settings.AutoPopulate.Name",
		hint: "DDB_PLUT.Settings.AutoPopulate.Hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
	});
	game.settings.register(MODULE_ID, "chapterFolders", {
		name: "DDB_PLUT.Settings.ChapterFolders.Name",
		hint: "DDB_PLUT.Settings.ChapterFolders.Hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
	});
};

/**
 * Scene directory context menu. v14 entries use label/icon class/visible/onClick; v13 used
 * name/icon HTML/condition/callback. Both sets of keys are given so either generation renders it.
 */
const addContextOption = (_app, options) => {
	const getScene = li => game.scenes.get((li instanceof HTMLElement ? li : li[0])?.dataset.entryId);
	const isVisible = li => game.user.isGM && ScenePopulator.mayHaveTokenData(getScene(li));
	const run = li => ScenePopulator.pPopulate(getScene(li), {force: true});
	options.push({
		label: "DDB_PLUT.ContextMenu.Populate",
		name: "DDB_PLUT.ContextMenu.Populate",
		icon: "fa-solid fa-dragon",
		visible: isVisible,
		condition: isVisible,
		onClick: (_event, li) => run(li),
		callback: li => run(li),
	});
};

Hooks.once("init", () => {
	registerSettings();
	// Debug / macro surface
	globalThis.DDBPlutoniumScenes = {
		populate: (scene = canvas.scene, opts) => ScenePopulator.pPopulate(scene, opts),
		getTokenData: (scene = canvas.scene) => ScenePopulator.pGetTokenData(scene),
		getCompendiums: () => CompendiumSource.getPacks(),
		organize: (scene = canvas.scene) => SceneOrganizer.pOrganize(scene),
		organizeAll: () => SceneOrganizer.pOrganizeAll(),
		mergeDuplicates: () => ActorMerger.pMergeDuplicates(ScenePopulator.findFolder()),
	};
});

Hooks.on("getSceneContextOptions", addContextOption);

Hooks.on("createScene", (scene, _options, userId) => {
	if (userId !== game.user.id || !game.user.isGM) return;
	// Only scenes imported by Plutonium: chapter data comes from its scene repository
	if (!scene.flags?.plutonium) return;
	ImportQueue.add(scene);
});
