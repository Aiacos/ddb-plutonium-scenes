# TODO

Open work for the module. The scene data side lives in [Aiacos/plutonium-scenes › TODO.md](https://github.com/Aiacos/plutonium-scenes/blob/main/TODO.md).

## ✅ Verification
- [ ] Live-test v0.4.0 with a full Curse of Strahd re-import: Martikov family and Rose/Thorn Durst use their CoS art, no actors duplicated between "Creatures" and "DDB Scene Creatures".

## 🐞 Known issues
- [ ] `populate(scene, {force: true})` adds tokens on top of the ones already placed; it should replace the tokens this module placed (`flags.ddb-plutonium-scenes.ddbName`).
- [ ] A world actor Plutonium imported is reused even if its rules edition differs from the **Rules edition** setting.

## ✨ Features
- [ ] Macro to merge duplicate actors left by versions before 0.4.0 (repoint tokens to the Plutonium actor, delete the copy).

## 🧪 Quality
- [ ] Unit tests for actor resolution (`WorldSource`, `CompendiumSource` name order, strict NPC lookup) with mocked `game` globals.
- [ ] ESLint config and a pre-commit lint step (only `node --check` today).
- [ ] CI workflow: lint, tests, build the zip on tags.
