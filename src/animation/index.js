import { PIXI } from '../pixi/lib';
import { EventEmitter } from "../common/event-emitter";
import { parsePath, resolvePath } from "./path";
import Random from './rng';
import createInstance from "./generators";
import getSprite from "./resources/getSprite";
import getSpritesheet from "./resources/getSpritesheet";
import { setRandomizer, evaluateExpression } from './expressions';
import Controller from './generators/controller';
import { inheritFrom } from './utils';
import { shared as imageCache } from '../utils/assetCache';
import loadImage from './resources/loadImage';

/** handles creating PIXI animations using defined files */
export class Animator extends EventEmitter {

	// custom types for compositions
	plugins = { }
	imageCache = imageCache

	/** creates a new instance */
	constructor(manifest, options) {
		super();

		// creates a new random number generator
		// that can be used to create consistent, but random
		// designs
		this.rng = new Random(options.seed);

		// TODO: expression functions are just lone functions
		// that aren't part of this class. This will set the
		// expression to use the preferred randomizer, but it
		// could be accidentially replaced - consider refactoring
		// to make all of this more clear
		setRandomizer(this.rng);

		// save the data file
		this.manifest = manifest;
		this.options = options;
	}

	/** the preferred prefix for loading external urls */
	get baseUrl() {
		return this.options.baseUrl || '/';
	}

	// alias for get spritesheet, just to make it clearer
	// what it's used for elsewhere
	preloadSpritesheet = spritesheetId => this.getSpritesheet(spritesheetId)

	/** handles loading a single sprite */
	getSpritesheet = async id => getSpritesheet(this, id)

	/** handles loading a single sprite */
	getSprite = async (spritesheetId, id) => {
		const spritesheet = await this.getSpritesheet(spritesheetId)
		const texture = await getSprite(this, spritesheetId, id, spritesheet.version);
		return PIXI.Sprite.from(texture);
	}
	
	/** handles loading a sprite as a canvas */
	getImage = async (spritesheetId, id) => {
		if (id) {
			const spritesheet = await this.getSpritesheet(spritesheetId)
			return await getSprite(this, spritesheetId, id, spritesheet.version)
		}
		// loading a non-spritesheet
		else {
			return await loadImage(`${this.baseUrl}/${spritesheetId}`);
		}
	}

	/** handles a custom type */
	install = (plugin, customizer, params) => {
		this.plugins[plugin] = { customizer, params };
	}

	/** attempts to find data for a path */
	lookup = resource => {
		const path = parsePath(resource);
		const resolved = resolvePath(this.manifest, path.parts);
		
		// check for an inherited source
		if (resolved && 'base' in resolved)
			inheritFrom(this, this.manifest, resolved, 'base');

		// resunt the 
		return resolved;
	}

	/** evaluates an expression */
	evaluateExpression = value => {
		return evaluateExpression(value);
	}

	/** handles composing a layer using the provided data
	 * @type {object} composition data
	 * @type {string} the relative path for the resource
	 */
	compose = async (data, resource, relativeTo) => {
		const controller = new Controller();
		const instance = await createInstance(this, controller, resource, data, relativeTo);
		instance.type = data.type;
		instance.path = resource;
		instance.controller = controller;

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
