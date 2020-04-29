import * as PIXI from 'pixi.js';
// import * as pp from 'pixi-particles';


import { EventEmitter } from "../common/event-emitter";
import { waitForEvent, isIterable, isString, isArray, map, flatten } from '../utils';
import cloneDeep from 'clone-deep';
import * as resources from './resources';

/** handles creating PIXI animations using defined files */
export class Animator extends EventEmitter {

	/** creates a new instance */
	constructor(data, options) {
		super();

		// save the data file
		this.data = data;
		this.options = options;
	}

	get baseUrl() {
		return this.options.baseUrl || '/';
	}

	/** handles creating a new instance from a path
	 * @type {string} path The resource name to create
	 */
	create = async (resource) => {
		
		// start by finding the resource
		const path = parsePath(resource);
		const data = resolvePath(this.data, path.parts);

		// doesn't seem to exist
		if (!data) {
			console.error(`Cannot resolve ${resource}`);
			return;
		}

		// has composition data
		if (data.compose !== undefined)
			return await createInstance(this, resource, data);

		// nothing to compose
		else {
			console.error('nothing to compse at', resource);
		}

	}

}

// creates an instance of a car
async function createInstance(animator, path, data) {
	const container = new PIXI.Container();
	const pending = [ ];

	// unpack all data
	const instance = cloneDeep(data);

	// start checking each layer
	for (const layer of instance.compose) {
		const { type } = layer;
		inheritFrom(animator, data, layer, 'base');

		// sprite layers
		if (type === 'sprite') {
			const sprite = createSprite(animator, path, data, layer);
			pending.push(sprite);
		}
		// particle emitters
		else if (type === 'emitter') {

		}
		// not a valid type
		else {
			console.error(`[compose] Unknown layer type "${type}"`);
		}

	}

	// wait for finished work
	const composite = await Promise.all(pending);
	const layers = flatten(composite);

	// layers.sort(byZIndex);

	// append all layers
	console.log(layers);
	for (const layer of layers)
		container.addChild(layer);

	// return the final layer
	return container;
}

async function createSprite(animator, path, data, layer) {
	let phase = '';
	try {

		// try and load images
		phase = 'resolving images';
		const images = await resolveImages(animator, path, data, layer);

		phase = 'generating textures';
		const textures = map(images, img => PIXI.Texture.from(img));
		
		// if there's multiple images, then it's animated
		phase = 'creating sprite instance';
		const isAnimated = images.length > 1;
		return isAnimated ? new PIXI.AnimatedSprite(textures)
			: new PIXI.Sprite(textures[0]);
	}
	catch(ex) {
		console.error(`Failed to create sprite ${path} while ${phase}`);
		throw ex;
	}

}

/** loads all images for a layer */
async function resolveImages(animator, path, data, layer) {

	// normalize images as a single array
	let images = [ ];
	for (const source of [layer.image, layer.images]) {
		if (isString(source))
			images.push(source);
		else if (isArray(source))
			images = images.concat(source);
	}

	// unpack all image reference
	delete layer.image;
	layer.images = images;
	unpack(animator, data, layer, 'images');

	// with each image, handle loading the correct resource
	const pending = [ ];
	for (const item of images) {
		let imageId;
		let spritesheetId;

		// read the path
		const ref = parsePath(item);

		// handle loading exernal image urls
		if (ref.isUrl) {
			const url = createUrlFromRef(ref);
			const promise = resources.loadImage(url);
			pending.push(promise);
			continue;
		}

		// check for an image relative to the current resource
		if (ref.isLocal) {
			imageId = item;
			spritesheetId = path;
		}
		// check for an image shared through the project
		else if (ref.isAbsolute) {
			spritesheetId = ref.parts.shift();
			imageId = ref.parts.join('/');
		}

		// load the spritesheet, if required
		const promise = getSprite(animator, spritesheetId, imageId);
		pending.push(promise);
	}

	// send back all loaded images?
	return await Promise.all(pending);
}

/** creates a url from a reference */
function createUrlFromRef(ref) {
	// nothing fancy, just remove the prefix
	return ref.path.substr(2);
}

/** handles getting ain image from a spritesheet */
async function getSprite(animator, spritesheetId, imageId) {
	const spritesheet = await getSpritesheet(animator, spritesheetId);
	return spritesheet[imageId];
}

// loads a spritesheet into memory
async function getSpritesheet(animator, spritesheetId) {

	// get the spritesheet instance
	const spritesheet = animator.data.spritesheets[spritesheetId];

	// check if the spritesheet needs to be created
	if (!spritesheet.__initialized__)
		await loadSpritesheet(animator, spritesheetId, spritesheet);

	// done
	return spritesheet;
}

// handle loading an external spritesheet
async function loadSpritesheet(animator, spritesheetId, spritesheet) {

	// load the image first
	// for now, only expect PNG images
	const url = `${animator.baseUrl}${spritesheetId}.png`;
	const image = await resources.loadImage(url);

	// with the image, create slices based on the spritesheet
	if (!spritesheet.__initialized__)
		generateSprites(image, spritesheetId, spritesheet);
}

// create individual sprites from an image
function generateSprites(image, spritesheetId, spritesheet) {

	// create each sprite slice
	for (const id in spritesheet) {
		const [ x, y, width, height ] = spritesheet[id];
		
		// match the canvas
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		// extra data (debugging)
		canvas.setAttribute('spritesheet', spritesheetId);
		canvas.setAttribute('sprite', id);

		// draw the sprite
		const ctx = canvas.getContext('2d');
		ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

		// replace the bounds
		spritesheet[id] = canvas;
	}

	// spritesheet is ready for use
	spritesheet.__initialized__ = true;
}



// parses a path to determine a resource
function parsePath(path) {
	
	// identify the type
	const isUrl = path.substr(0, 2) === ':/';
	const isAbsolute = !isUrl && path.substr(0, 2) === '//';
	const isRelative = !isAbsolute && path.substr(0, 1) === '/';
	const isLocal = !(isAbsolute || isUrl || isRelative);

	// trim off the prefix
	const index = isUrl ? 2
		: isAbsolute ? 2
		: isRelative ? 1
		: 0;

	// create each part of the resource path
	const parts = path.substr(index).split(/\/+/g);

	return { path, parts, isAbsolute, isRelative, isLocal, isUrl };
}

// resolves a path to a data point
// cache result?
function resolvePath(data, parts) {
	if (isString(parts)) {
		parts = parsePath(parts);
	}

	let block = data;
	for (let i = 0; i < parts.length; i++)
		block = block && block[parts[i]];
	return block;
}

function inheritFrom(animator, data, layer, prop) {
	const base = layer[prop];
	if (!base) return;

	// apply the inherited properties
	const basedOn = clone(animator, data, base);
	Object.assign(layer, basedOn);
}

/** clones an individual data node */
function clone(animator, data, path) {
	if (isString(path)) {
		path = parsePath(path);
	}

	const source = path.isAbsolute ? animator.data : data;
	const cloned = resolvePath(source, path.parts);
	return cloneDeep(cloned);
}


/** expands out a node to clone all data refs */
function unpack(animator, root, source, prop, limit = 0) {
	if (++limit > 10) {
		throw new RecursiveLimitExceededException();
	}

	// get the value to check
	const obj = source[prop];
	
	// check to resolve a path
	if (isString(obj)) {
		const ref = parsePath(obj);

		// if this refers to cloning local data
		if (ref.isRelative) {
			source[prop] = clone(animator, root, ref);

			// recurisvely unpack looking for
			// other cloned refs
			unpack(animator, root, source, prop, limit);
		}
	}
	// if this is a collection, perform this for
	// each of the properties
	else if (isIterable(obj)) {
		for (const id in obj) {
			unpack(animator, root, obj, id, limit);
		}
	}
}

// exceptions
function RecursiveLimitExceededException() { }