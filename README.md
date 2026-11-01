# DDB Scenes for Plutonium

Brings the **D&D Beyond Importer community scene data** ([MrPrimate/ddb-meta-data](https://github.com/MrPrimate/ddb-meta-data)) to maps imported with **Plutonium**: lights, missing walls, and the monsters and NPCs placed on each map.

It works in two parts:

| Part | What it does |
|------|--------------|
| [Aiacos/plutonium-scenes](https://github.com/Aiacos/plutonium-scenes) (`generated` branch) | A fork of Plutonium's scene repository, rebuilt daily. It adds the DDB lights (and walls where Plutonium has none) and stores the creature placements in each map's scene flags. Plutonium reads it natively, so Plutonium itself is not modified. |
| This module | Places the creatures stored on the scene, as actors from the **official D&D compendiums** (default) or imported through **Plutonium** with a dynamic token ring. |

## 📦 Installation

1. Install this module (manifest: `https://github.com/Aiacos/ddb-plutonium-scenes/releases/latest/download/module.json`) and enable it.
2. In **Plutonium → Config → Import (Maps) → Advanced**, set **Base Scene Repository URL** to
   `https://raw.githubusercontent.com/Aiacos/plutonium-scenes/generated`
   (keep "Fetch Supplementary Data from Scene Repository" enabled). Plutonium caches the JSON it loads, so reload Foundry afterwards.

## 🎯 Usage

Import a map with Plutonium's map importer as usual. The scene arrives with its lights and walls; the module then places the creatures (setting **Place creatures on scene import**), or you can right-click the scene in the Scenes sidebar → **Place DDB monsters & NPCs**.

A GM-only chat message lists how many creatures were placed and which were not found.

## ⚙️ Settings

| Setting | Default | |
|---------|---------|--|
| Monster & NPC source | Official compendiums | *Official compendiums* imports actors from the Wizards of the Coast compendiums installed in the world (or uses NPC Token Replacer's compendium selection when that module is active). *Plutonium* imports the 5etools creature. |
| Fall back to the other source | on | Tries the other source for creatures the chosen one lacks (needs Plutonium). |
| Dynamic ring for Plutonium creatures | on | Enables the token dynamic ring on Plutonium-imported creatures. |
| Place creatures on scene import | on | Places creatures as soon as Plutonium creates the scene. |

Each creature is imported once into the **DDB Scene Creatures** actor folder and reused.

## 🐛 Console

```js
DDBPlutoniumScenes.populate();              // the scene on the canvas
DDBPlutoniumScenes.populate(scene, {force: true});
DDBPlutoniumScenes.getTokenData();          // creature placements stored on the scene
DDBPlutoniumScenes.getCompendiums();        // compendiums searched in compendium mode
```

## 📜 Licence and credits

MIT. Scene data from the DDB Importer community (MIT, released as unofficial Fan Content under the Wizards of the Coast Fan Content Policy). Plutonium by Giddy.
