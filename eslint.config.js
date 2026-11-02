import js from "@eslint/js";
import globals from "globals";

/** Foundry VTT, dnd5e and Plutonium globals the module reads at runtime. */
const foundryGlobals = Object.fromEntries([
	"game", "ui", "canvas", "foundry", "Hooks", "CONFIG",
	"Actor", "Folder", "ChatMessage",
	"DataLoader", "UrlUtil",
].map(name => [name, "readonly"]));

export default [
	js.configs.recommended,
	{
		files: ["scripts/**/*.js"],
		languageOptions: {ecmaVersion: 2024, sourceType: "module", globals: {...globals.browser, ...foundryGlobals}},
	},
	{
		files: ["test/**/*.js", "eslint.config.js"],
		languageOptions: {ecmaVersion: 2024, sourceType: "module", globals: {...globals.node}},
	},
	{
		rules: {
			"comma-dangle": ["error", "always-multiline"],
			"indent": ["error", "tab", {SwitchCase: 1}],
			"quotes": ["error", "double", {avoidEscape: true}],
			"semi": ["error", "always"],
			"no-unused-vars": ["error", {argsIgnorePattern: "^_"}],
		},
	},
];
