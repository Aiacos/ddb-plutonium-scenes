# TODO

Open work for the module. The scene data side lives in [Aiacos/plutonium-scenes › TODO.md](https://github.com/Aiacos/plutonium-scenes/blob/main/TODO.md).

## ✅ Verification
- [x] Live test (2026-11-02, Foundry v14.369, clean Curse of Strahd import, 84 scenes): Martikov family and Rose/Thorn Durst with their CoS art; all scenes filed; nothing missing; 5 same-edition duplicates found → fixed in 0.5.1 and folded by `mergeDuplicates()` (614 tokens kept, none orphaned); forced re-populate keeps 21/21 tokens on Death House.

## 🐞 Known issues
- [x] `populate(scene, {force: true})` stacked a second set of tokens — now replaces the ones this module placed (0.5.0).
- [x] A Plutonium actor of the other rules edition was reused — only the chosen edition's statblock is reused now (0.5.0).
- [x] `build.sh` pointed to a release workflow that did not exist — CI now publishes releases from tags (0.5.0).

## ✨ Features
- [x] `DDBPlutoniumScenes.mergeDuplicates()` folds copies made before 0.4.0 into Plutonium's actors (0.5.0).

## 🧪 Quality
- [x] Unit tests for actor resolution and merging (`npm test`, Foundry globals mocked).
- [x] ESLint and a versioned pre-commit hook (`npm run hooks`: gitleaks, lint, tests).
- [x] CI: lint and tests on every push and pull request; release from `v*` tags.
