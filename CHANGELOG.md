# Changelog

## [0.5.1] - 2026-11-02

### Fixed
- A creature Plutonium imported is also reused when the scene data names a later reprint of the same statblock in the same rules edition (a 2024 "Commoner" from another book than the Monster Manual 2024), instead of importing a duplicate. Found in a clean Curse of Strahd import test: 5 duplicates left out of 199 actors.

## [0.5.0] - 2026-11-02

### Added
- `DDBPlutoniumScenes.mergeDuplicates()`: moves the tokens of creatures imported by earlier versions onto the actors Plutonium already imported for the same creature, and deletes the copies.
- Scene data now resolves NPCs through the adventure text itself ("Prince Livid" is a gray ooze in *Out of the Abyss*), and plural names to their statblock.

### Changed
- Placing creatures again (scene context menu, `populate(scene, {force: true})`) replaces the creatures this module placed before instead of adding a second set. Tokens added by hand are kept.
- A creature Plutonium imported is reused only when it is the statblock of the chosen **Rules edition**.

### Fixed
- Scene data: 78 more maps get DDB lights and creatures (same name and image shape, confirmed by their walls where both have some), and walls drawn past the map image are trimmed to it.

### Development
- ESLint, unit tests (`npm test`), a versioned pre-commit hook (`npm run hooks`) and a CI workflow that also publishes releases from version tags.

## [0.4.0] - 2026-11-02

### Fixed
- **Adventure NPCs get their own statblock and art**: DDB places many named NPCs with a generic statblock (Danika, Urwin, Brom and Bray Martikov as Commoners; Morgantha as a Night Hag). The scene repository now resolves them to the adventure's own 5etools creature (Danika Dorakova, Urwin Martikov, …), also when DDB names them differently (Rose and Thorn Durst → Rosavalda "Rose" Durst, Thornboldt "Thorn" Durst). Their generic statblock is only used when no source has the NPC.
- **No duplicate actors**: creatures Plutonium already imported into the world (e.g. by an adventure import, in its "Creatures" folder) are reused before anything is imported, so each creature appears once in the Actors tab with Plutonium's art.

## [0.3.0] - 2026-11-02

### Fixed
- **Player versions get their creatures**: importing an adventure's player maps placed no creatures, because Plutonium gives scene data to a map by its own name only. The scene repository now carries the DM map's lights, walls and creatures for each player version too (rescaled when the player image has another resolution), and scenes imported before that get their creatures from the repository: re-run them with the scene context menu, or re-import to also get walls and lights.
- Battlemap player versions ("Main Floor (Battlemap; Player Version)") are filed into their chapter folder.
- Maps sharing a name with a battlemap (Curse of Strahd "Map 2: Walls of Ravenloft") and maps with a creature link in their title ("Baba Lysaga's Creeping Hut") were missing from the scene repository and stayed outside their chapter folder.

### Changed
- The **dynamic token ring** setting now also applies to creatures from official compendiums, not only to Plutonium imports.

## [0.2.0] - 2026-11-02

### Added
- **Chapter folders**: imported scenes are filed into Book › Chapter folders in reading order, like DDB Importer. `DDBPlutoniumScenes.organizeAll()` files scenes imported earlier.
- **Rules edition** setting (2024 by default): picks the newest 2024 statblock, following 2024 renames (Goblin → Goblin Warrior), or the 2014 one. Applies to both official compendiums (SRD 5.2 / Monster Manual 2024 vs SRD 5.1) and Plutonium imports.
- Progress bar while creatures are placed; tokens appear on the scene in batches of 10.

### Fixed
- Creatures seemed not to be placed after importing a whole adventure: placement started while Plutonium was still importing, and Plutonium's first creature import of a session caches every compendium, which can take minutes with no visible progress. Imported scenes are now queued and handled once the import has finished, one at a time, sharing one compendium index; a notice explains the first-import delay.
- Player versions of maps are filed next to their DM map (Plutonium does not give them the DM map's scene data).

## [0.1.1] - 2026-11-01

### Fixed
- Creature data is read straight from the scene flags, so it is found even when Foundry's flag-scope validation would reject `getFlag` for it.

## [0.1.0] - 2026-11-01

### Added
- Places the DDB Importer community monster/NPC placements stored on Plutonium-imported scenes.
- Official compendiums as the default source (reusing NPC Token Replacer's selection when active); Plutonium import with dynamic token ring as the alternative; fallback between the two.
- Auto-placement on scene import, scene-directory context menu, GM chat report of creatures not found.
