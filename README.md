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

Scenes, player versions included, are also filed into **Book › Chapter** folders in reading order, as DDB Importer does (setting **Chapter folders**). To file scenes imported before, run `DDBPlutoniumScenes.organizeAll()` in the console.

Scenes are handled once Plutonium's import has finished (a few seconds after the last scene appears), one scene at a time with a progress bar. The first time a session needs a creature from Plutonium, Plutonium caches every compendium first, which can take a minute or two.

## ⚙️ Settings

| Setting | Default | |
|---------|---------|--|
| Monster & NPC source | Official compendiums | *Official compendiums* imports actors from the Wizards of the Coast compendiums installed in the world (or uses NPC Token Replacer's compendium selection when that module is active). *Plutonium* imports the 5etools creature. |
| Rules edition | 2024 | *2024* uses the most recently published 2024 statblock (Monster Manual 2024, SRD 5.2, newer books), following 2024 renames (Goblin → Goblin Warrior). *2014* uses the original statblocks. A creature with no statblock in the chosen edition uses the other one. |
| Fall back to the other source | on | Tries the other source for creatures the chosen one lacks (needs Plutonium). |
| Dynamic token ring | on | Enables the token dynamic ring on placed creatures (compendium and Plutonium). |
| Place creatures on scene import | on | Places creatures as soon as Plutonium creates the scene. |
| Chapter folders | on | Files imported scenes into Book › Chapter folders. |

Creatures Plutonium already imported into the world (for example by an adventure import, in its "Creatures" folder) are reused first. Anything else is imported once into the **DDB Scene Creatures** actor folder and reused.

Named adventure NPCs that D&D Beyond places with a generic statblock (Danika Martikov as a Commoner) use the adventure's own creature and art (Danika Dorakova) when a source has it, and the generic statblock otherwise.

## 🐛 Console

```js
DDBPlutoniumScenes.populate();              // the scene on the canvas
DDBPlutoniumScenes.populate(scene, {force: true});
DDBPlutoniumScenes.getTokenData();          // creature placements stored on the scene
DDBPlutoniumScenes.getCompendiums();        // compendiums searched in compendium mode
DDBPlutoniumScenes.organize(scene);         // file one scene into its chapter folder
DDBPlutoniumScenes.organizeAll();           // file every scene that has chapter data
```

## 📜 Licence and credits

MIT. Scene data from the DDB Importer community (MIT, released as unofficial Fan Content under the Wizards of the Coast Fan Content Policy). Plutonium by Giddy.
