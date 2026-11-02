# Changelog

## [0.6.1] - 2026-11-02

### Fixed
- Common monsters come from the **Monster Manual** when it has them, instead of a reprint in another official book: Curse of Strahd had its Giant Spiders and Wolves from the Dungeon Master's Guide, Skeletons from Forge of the Artificer and Guards, Revenants and Wights from Ravenloft: Horrors Within. Creatures only one book has (Madam Eva) still come from that book.

## [0.6.0] - 2026-11-02

### Changed
- **Official statblocks first**: in compendium mode a creature now comes from the official compendiums installed in the world (Monster Manual 2024 and the other Wizards of the Coast books) when they have it in the chosen rules edition, before the copy Plutonium downloaded with the adventure. Adventure NPCs the official books lack (Danika Dorakova, Morgantha) still use Plutonium's actors. Plutonium mode is unchanged.
- `mergeDuplicates()` keeps copies from official compendiums instead of folding them into Plutonium's actors.

To switch creatures already placed, right-click a scene → **Place DDB monsters & NPCs** (it replaces what the module placed).

## [0.5.3] - 2026-11-02

### Fixed
- Restoring personal names after a token-naming module could put a name on the wrong token (a Dretch named "Morgantha" in Old Bonegrinder): new tokens can come back in another order, so they are now matched through an index stored on each token.
- The chat report and the startup log show the version the client really runs, read from the module's `module.json`: after an in-place update Foundry keeps reporting the old version until the server restarts.

## [0.5.2] - 2026-11-02

### Fixed
- **Named NPCs keep their names** when a token-naming module (Token Mold) renames new tokens: Bella Sunbane and Offalia Wormwiggle, Morgantha's daughters in Old Bonegrinder, had become "Capable Night Hag (1)" and "Steadfast Night Hag (2)". Generic creatures ("Ghoul 3") are still left to the naming module.

### Added
- The chat report says where the creatures came from (Plutonium actors already in the world, official compendiums, Plutonium imports), lists source errors instead of only logging them, and shows the module version; the console logs the version at startup. This makes a failing import diagnosable from the report alone.

### Scene data
- Curse of Strahd: Wizard of Wines Winery, Abbey of Saint Markovia ground floor, Tsolenka Pass, Baba Lysaga's Creeping Hut, Ruins of Berez and the Elevator Trap now have DDB creatures, lights and walls (see the plutonium-scenes CHANGELOG).

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
