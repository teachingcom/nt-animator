import * as PIXI from 'pixi.js';
import { EventEmitter } from "../common/event-emitter";
import { parsePath, resolvePath } from "./path";
import createInstance from "./generators";
import getSprite from "./resources/getSprite";
import getSpritesheet from "./resources/getSpritesheet";

/** handles creating PIXI animations using defined files */
export class Animator extends EventEmitter {

	// custom types for compositions
	plugins = { }

	/** creates a new instance */
	constructor(manifest, options) {
		super();

		// save the data file
		this.manifest = manifest;
		this.options = options;
	}

	/** the preferred prefix for loading external urls */
	get baseUrl() {
		return this.options.baseUrl || '/';
	}

	/** handles loading a single sprite */
	getSpritesheet = async id => {
		return getSpritesheet(this, id);
	}

	/** handles loading a single sprite */
	getSprite = async (spritesheetId, id) => {
		const canvas = await getSprite(this, spritesheetId, id);
		// const texture = PIXI.Texture.from(canvas);
		return PIXI.Sprite.from(canvas);
	}

	/** handles a custom type */
	install = (plugin, customizer) => {
		this.plugins[plugin] = customizer;
	}

	/** attempts to find data for a path */
	lookup = resource => {
		const path = parsePath(resource);
		return resolvePath(this.manifest, path.parts);
	}

	/** handles composing a layer using the provided data
	 * @type {object} composition data
	 * @type {string} the relative path for the resource
	 */
	compose = async (data, resource, relativeTo) => {
		const instance = await createInstance(this, resource, data, relativeTo);
		instance.type = data.type;
		instance.path = resource;
		return instance;
	}

	/** handles creating a new instance from a path
	 * @type {string} path The resource name to create
	 */
	create = async resource => {
		const data = this.lookup(resource);

		// doesn't seem to exist
		if (!data) {
			console.error(`Cannot resolve node ${resource}`);
			return;
		}

		// missing composition data
		if (data.compose === undefined) {
			console.error('nothing to compose at', resource);
			return;
		}

		// compose the resource
		return this.compose(data, resource);
	}

}
