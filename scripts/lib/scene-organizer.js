import {log, warn} from "./constants.js";
import {SideData} from "./side-data.js";

/** Foundry's spacing between manually sorted siblings (`CONST.SORT_INTEGER_DENSITY`). */
const SORT_STEP = 100000;

/**
 * Files Plutonium-imported scenes into "Book > Chapter" folders in reading order, the layout DDB
 * Importer gives adventure scenes. The generator stores each map's place in its book:
 * `flags["ddb-plutonium-scenes"].folder = {path: [book, chapter], sort: [chapterIx, mapIx]}`.
 */
export class SceneOrganizer {
	/** "parentId|name" -> Promise<Folder>, so a batch import creates each folder once */
	static #folders = new Map();

	static async #pGetFolder ({name, parent, sort}) {
		const key = `${parent?.id ?? ""}|${name}`;
		if (!this.#folders.has(key)) {
			const existing = game.folders.find(f => f.type === "Scene" && f.name === name && (f.folder?.id ?? null) === (parent?.id ?? null));
			const promise = existing
				? Promise.resolve(existing)
				: Folder.implementation.create({name, type: "Scene", folder: parent?.id ?? null, sorting: "m", sort});
			// Forget failures (and folders deleted later) so a later scene can retry
			this.#folders.set(key, promise.catch(e => { this.#folders.delete(key); throw e; }));
		}
		const folder = await this.#folders.get(key);
		if (game.folders.has(folder.id)) return folder;
		this.#folders.delete(key);
		return this.#pGetFolder({name, parent, sort});
	}

	/** Scenes already filed by hand under this book keep their place in the tree. */
	static #getBookParent (scene, bookName) {
		const current = scene.folder;
		if (current?.name === bookName) return current.folder ?? null;
		if (current?.folder?.name === bookName) return current.folder.folder ?? null;
		return null;
	}

	/**
	 * @param {Scene} scene
	 * @param {Set<Folder>} [emptied] collects the folders the scene was moved out of
	 * @return {Promise<boolean>} whether the scene was moved
	 */
	static async pOrganize (scene, {emptied} = {}) {
		if (!game.user.isGM) return false;
		const flags = await SideData.pGetModuleFlags(scene);
		const path = flags?.folder?.path;
		if (path?.length !== 2) return false;
		const [bookName, chapterName] = path;
		const [chapterIx = 0, mapIx = 0] = flags.folder.sort ?? [];

		try {
			const book = await this.#pGetFolder({name: bookName, parent: this.#getBookParent(scene, bookName), sort: 0});
			const chapter = await this.#pGetFolder({name: chapterName, parent: book, sort: chapterIx * SORT_STEP});
			if (scene.folder?.id === chapter.id) return false;
			const previous = scene.folder;
			// A player version sorts right after its DM map
			await scene.update({folder: chapter.id, sort: mapIx * SORT_STEP + (flags.isPlayerVersion ? SORT_STEP / 2 : 0)});
			if (previous) emptied?.add(previous);
			return true;
		} catch (e) {
			warn(`Could not file "${scene.name}" under ${bookName} > ${chapterName}`, e);
			return false;
		}
	}

	/** Removes folders that importing left empty, e.g. Plutonium's default "Plutonium CoS". */
	static async pDeleteEmpty (folders) {
		for (const folder of folders) {
			if (!game.folders.has(folder.id) || folder.contents.length || folder.children.length) continue;
			await folder.delete();
		}
	}

	/** Files every Plutonium-imported scene, e.g. scenes imported before this module was enabled. */
	static async pOrganizeAll () {
		const emptied = new Set();
		let moved = 0;
		for (const scene of game.scenes) {
			if (!scene.flags?.plutonium) continue;
			if (await this.pOrganize(scene, {emptied})) moved++;
		}
		await this.pDeleteEmpty(emptied);
		log(`Filed ${moved} scenes into chapter folders`);
		return moved;
	}
}
