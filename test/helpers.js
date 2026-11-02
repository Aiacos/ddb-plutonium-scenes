/** Minimal stand-ins for the Foundry globals the module reads, so its logic runs under node:test. */
export const installFoundryMocks = ({actors = [], packs = []} = {}) => {
	globalThis.game = {
		actors: Object.assign([...actors], {get: id => actors.find(a => a.id === id)}),
		packs,
		folders: [],
		modules: new Map(),
		i18n: {localize: key => key, format: key => key},
	};
	globalThis.foundry = {utils: {getProperty: (obj, path) => path.split(".").reduce((o, k) => o?.[k], obj)}};
	globalThis.ui = {notifications: {info: () => null, warn: () => null}};
	delete globalThis.UrlUtil;
	delete globalThis.NPCTokenReplacer;
};

/** A world actor Plutonium imported from 5etools. */
export const plutActor = ({id, name, source, ring = false}) => ({
	id,
	name,
	flags: {plutonium: {page: "bestiary.html", source, hash: `${encodeURIComponent(name.toLowerCase())}_${source.toLowerCase()}`}},
	prototypeToken: {ring: {enabled: ring, subject: {}}, texture: {src: `${name}.webp`}},
	updates: [],
	async update (data) { this.updates.push(data); },
});

/** A compendium with an index of `{name, rules}` creatures. */
export const pack = ({packageName, name = "actors", entries}) => {
	const index = entries.map((it, i) => ({_id: `${packageName}${i}`, name: it.name, type: "npc", system: {source: {rules: it.rules}}, uuid: `Compendium.${packageName}.${name}.Actor.${i}`}));
	return {
		documentName: "Actor",
		collection: `${packageName}.${name}`,
		metadata: {packageName, name},
		getIndex: async () => index,
		getDocument: async id => index.find(it => it._id === id),
	};
};
