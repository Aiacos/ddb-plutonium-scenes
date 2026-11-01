# Changelog

## [0.1.1] - 2026-11-01

### Fixed
- Creature data is read straight from the scene flags, so it is found even when Foundry's flag-scope validation would reject `getFlag` for it.

## [0.1.0] - 2026-11-01

### Added
- Places the DDB Importer community monster/NPC placements stored on Plutonium-imported scenes.
- Official compendiums as the default source (reusing NPC Token Replacer's selection when active); Plutonium import with dynamic token ring as the alternative; fallback between the two.
- Auto-placement on scene import, scene-directory context menu, GM chat report of creatures not found.
