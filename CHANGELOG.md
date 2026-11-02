# Changelog

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
