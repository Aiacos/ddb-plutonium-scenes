# Security Policy

## 📦 Supported versions

Only the latest release receives fixes. Update through Foundry's module manager (manifest: `releases/latest/download/module.json`).

## 🔒 Reporting a vulnerability

Report privately through GitHub: **Security → Report a vulnerability** on [Aiacos/ddb-plutonium-scenes](https://github.com/Aiacos/ddb-plutonium-scenes/security/advisories/new). Please do not open a public issue. Include the module and Foundry versions and steps to reproduce.

## 🛡️ Security model

- [x] Runs only in the GM's browser; players' clients do nothing (`game.user.isGM` guards).
- [x] No secrets, accounts or network calls of its own. Scene data is fetched from the scene repository URL configured in **Plutonium**, by Plutonium or by `SideData` from the same URL.
- [x] Scene data is treated as untrusted: names from it are HTML-escaped before going into the GM chat report.
- [x] Actors come only from installed compendiums, actors already in the world, or Plutonium's own importer.
- [x] Commits are scanned by a gitleaks pre-commit hook.

## ⚠️ Trust boundary

The scene repository (`Aiacos/plutonium-scenes`, `generated` branch) decides what is placed on imported scenes. Pointing Plutonium at another repository means trusting that repository's data.
