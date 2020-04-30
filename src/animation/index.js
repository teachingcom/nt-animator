// import assignDeep from 'assign-deep';
// import deepDefaults from 'deep-defaults';

import deep from 'deep-get-set';
import * as PIXI from 'pixi.js';
import * as assign from './assign';
import * as pop from 'popmotion';
const { assignIf } = assign;

// import * as pp from 'pixi-particles';
const PASSTHROUGH = v => v;
const CONVERTERS = {
	'rotation': assign.toRotation,
	'fps': assign.toAnimationSpeed
};


import { EventEmitter } from "../common/event-emitter";
import { waitForEvent, isIterable, isString, isArray, map, flatten, isNumber } from '../utils';
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
	
	// unpack all data
	const instance = cloneDeep(data);
	
	// create the instance container
	const container = new PIXI.Container();
	container.update = noop;
	
	// kick off creating each element
	const pending = [ ];
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

	// with all results, create the final object
	for (const comp of composite) {

		// add each element
		for (const layer of comp) {
			container.update = appendFunc(container.update, layer.update);
			container.addChild(layer.displayObject);
		}

	}

	// // const layers = flatten(composite);

	// // layers.sort(byZIndex);

	// // append all layers
	// for (const layer of layers) {

	// }
	// 	container.addChild(layer);

	// return the final layer
	return container;
}

function setDefaults(target, prop, defaults) {
	let assignTo = target[prop];

	// nothing has been assigned
	if (!assignTo) {
		target[prop] = cloneDeep(defaults);
		return;
	}

	// set each missing value
	for (const id in defaults) {
		if (assignTo[id] === undefined)
			assignTo[id] = defaults[id];
	}
}

function appendFunc(orig, append) {
	return () => { orig(); append(); }
}

const noop = () => { };
async function createSprite(animator, path, composition, layer) {

	// recursively built update function
	let update = noop;

	// tracking setup phase
	let phase = '';
	try {

		// gather all required images
		phase = 'resolving images';
		const images = await resolveImages(animator, path, composition, layer);

		// create textures for each sprite
		phase = 'generating textures';
		const textures = map(images, img => PIXI.Texture.from(img));
		
		// create the instance of the sprite
		phase = 'creating sprite instance';
		const isAnimated = images.length > 1;
		const sprite = isAnimated
			? new PIXI.AnimatedSprite(textures)
			: new PIXI.Sprite(textures[0]);

		// if animated, start playback
		if (isAnimated) sprite.play();

		// set some default values
		sprite.pivot.x = sprite.width / 2;
		sprite.pivot.y = sprite.height / 2;

		// set defaults
		setDefaults(layer, 'props', {
			rotation: 0,
			scaleY: 1,
			scaleX: 1,
			pivotX: 0.5,
			pivotY: 0.5,
			x: 0,
			y: 0
		});

		// assign default props
		assignDisplayObjectProps(sprite, layer.props);

		// setup animations, if any
		phase = 'creating animations';
		sprite.animation = createAnimation(animator, composition, layer, sprite);

		// attach the update function
		return [{ displayObject: sprite, update }];
	}
	catch(ex) {
		console.error(`Failed to create sprite ${path} while ${phase}`);
		throw ex;
	}

}


// creates an animation
function createAnimation(animator, composition, layer, instance) {
	if (!layer.animation) return;

	// unpack any variables
	layer.animation = cloneDeep(layer.animation);
	unpack(animator, composition, layer, 'animation');

	// start creating the popmotion animation
	const { keyframes, sequence, loop = Infinity, duration = 1000, ease } = layer.animation;
	const easings = pop.easing[ease] || pop.easing.linear;
	const animation = {
		timings: [ ],
		values: keyframes || sequence || [ ],
		easings,
		loop,
		duration
	};

	// copy all default values for the starting frame
	const starting = { };

	//TODO: create an update mapper to improve performance

	// create a timings parameter
	for (let i = 0; i < animation.values.length; i++) {
		const keyframe = animation.values[i];

		// get the timing value, if any
		const timing = isNumber(keyframe.at) ? keyframe.at : i / animation.values.length;
		animation.timings.push(timing);

		// copy all default values
		for (const prop in keyframe) {
			if (!(prop in starting)) {
				starting[prop] = deep(layer, `props.${prop}`);
			}
		}
	}

	// include the starting frame of animation
	// and also shift timings to account for
	// the extra frame of animation
	animation.values.unshift(starting);
	animation.timings.push(1);

	// create the animation that assigns
	// property values
	const handler = pop.keyframes(animation);
	handler.start({
		update: update => {
			assignDisplayObjectProps(instance, update);
		}
	});

	// return the animation object
	return handler;
}



// update a sprite to use new props
function assignDisplayObjectProps(target, props) {
	if (!props) return;
	
	// positions
	assignIf(props.x, isNumber, target, assign.setX);
	assignIf(props.y, isNumber, target, assign.setY);
	assignIf(props.z, isNumber, target, assign.setZ);
	assignIf(props.rotation, isNumber, target, assign.setRotation);
	assignIf(props.fps, isNumber, target, assign.setFps);
	assignIf(props.blend, isString, target, assign.setBlendMode);

	// alpha
	props.alpha = props.alpha || props.opacity;
	assignIf(props.alpha, isNumber, target, assign.setAlpha);
	
	// origin
	assignIf(props.pivotX, isNumber, target.pivot, assign.setRelativeX, target.width);
	assignIf(props.pivotY, isNumber, target.pivot, assign.setRelativeY, target.height);

	// scale
	assignIf(props.scaleX, isNumber, target.scale, assign.setX);
	assignIf(props.scaleY, isNumber, target.scale, assign.setY);
	

	// // layer origin/pivot
	// const pivot = props.pivot || props.origin;
	// if (pivot) {
	// }

	// // sizing
	// if (props.scale) {
	// 	assignIf(props.scale.x, isNumber, target.scale, assign.setX);
	// 	assignIf(props.scale.y, isNumber, target.scale, assign.setY);
	// }
}


/** loads all images for a layer */
async function resolveImages(animator, path, composition, layer) {

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
	unpack(animator, composition, layer, 'images');

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

function inheritFrom(animator, composition, layer, prop) {
	const base = layer[prop];
	if (!base) return;

	// apply the inherited properties
	const basedOn = clone(animator, composition, base);
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