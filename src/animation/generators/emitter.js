import * as PIXI from 'pixi.js';
import * as Particles from 'pixi-particles';
import { assignIf } from "../assign";
import { isNumber, noop, map, setDefaults, isString, isArray, TAU } from "../../utils";

import resolveImages from "../resources/resolveImages";
import createAnimation from './animation';

// emitter property mappings
const MAPPINGS = {
	alpha: { props: ['start', 'end'], allowList: true },
	scale: { props: ['start', 'end'], allowList: true },
	color: { props: ['start', 'end'], allowList: true },
	speed: { props: ['start', 'end'], allowList: true },
	dir: { props: ['min', 'max'], renameTo: 'startRotation' },
	rotationSpeed: { props: ['min', 'max'] },
	life: { props: ['min', 'max'], renameTo: 'lifetime' }
};

// default parameters to create a sprite
const EMITTER_DEFAULTS = {
	rotation: 0,
	scaleY: 1,
	scaleX: 1,
	pivotX: 0.5,
	pivotY: 0.5,
	x: 0,
	y: 0
};

/** creates an emitter instance */
export default async function createEmitter(animator, path, composition, layer) {

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
		phase = 'configuring emitter';

		// generate a config -- pixi-particles uses a lot of
		// objects that are difficult to work with - nt-animator
		// just accepts arrays and shorthand names, but the need to
		// be converted - the list of mappings are at the top of the
		// file to make it easier to understand
		const config = { autoUpdate: true };
		const { emit = { } } = layer;
		for (const prop in emit) {
			const mapping = MAPPINGS[prop];
			if (!mapping) continue;

			// get the array of value
			let assign = emit[prop];

			// if this is a complex list and theres
			// more than just two values, create a more
			// complex version -- for now, default timing
			// to be relative to the total position
			const total = assign.length;
			if (total > 2 && mapping.allowList) {
				assign = {
					list: map(assign, (value, i) => ({
						value, time: i / (total - 1)
					}))
				};
			}
			// otherwise, just create a simple start/stop
			else {
				const [start, stop] = assign;
				assign = {
					[mapping.props[0]]: start,
					[mapping.props[1]]: stop
				};
			}
			
			// copy the properties using 'start' and 'end' as default
			// property names
			config[mapping.renameTo || prop] = assign;
		}

		// assign a few more values
		assignIf(emit.per, isNumber, config, (t, v) => t.particlesPerWave = v);
		assignIf(emit.max, isNumber, config, (t, v) => t.maxParticles = v);
		assignIf(emit.frequency, isNumber, config, (t, v) => t.frequency = 1 / v);
		assignIf(emit.chance, isNumber, config, (t, v) => t.spawnChance = v);
		assignIf(emit.type, isString, config, (t, v) => t.spawnType = v);
		
		// as it turns out, the library will look up the correct enum on its own
		assignIf(emit.blend, isString, config, (t, v) => t.blendMode = v);

		// boolean props
		config.noRotation = !!emit.noRotation;
		config.atBack = !!emit.atBack;
		config.orderedArt = !!emit.orderedArt;

		// NOTE: Check the end of the file for overrides to Particle behavior
		// default to random starting rotations if not overridden
		if (!!emit.randomStartRotation) {
			config.randomStartRotation = isArray(emit.randomStartRotation)
				? emit.randomStartRotation
				: [0, 360];
		}

		// appears to be required
		config.pos = {
			x: emit.x || 0,
			y: emit.y || 0
		};

		// check for emission bounds
		phase = 'defining emitter bounds';

		// is a radial spawn
		defineBounds(config, emit);

		// create the emitter
		phase = 'creating emitter instance';
		const container = new PIXI.Container();
		container.emitter = new Particles.Emitter(container, textures, config);
		container.emitter.config = config;

		// set container defaults
		setDefaults(layer, 'props', EMITTER_DEFAULTS);
		Object.assign(container, layer.props);

		// animate, if needed
		phase = 'creating animation';
		container.animation = createAnimation(animator, path, composition, layer, container);

		// attach the update function
		return [{ displayObject: container, update }];
	}
	catch(ex) {
		console.error(`Failed to create emitter ${path} while ${phase}`);
		throw ex;
	}

}


// defines generator spawn points
function defineBounds(config, params) {

	// is a circle
	if (!!params.circle)
		defineCircleBounds(config, params.circle);

	// is a rectangle
	else if (!!params.rect || !!params.rectangle || !!params.box)
		defineRectangleBounds(config, params.rect || params.rectangle || params.box);
}


// creates a circular generation point
function defineCircleBounds(config, circle) {
	let x, y, r;

	// all three params provided
	if (circle.length === 3) {
		x = circle[0];
		y = circle[1];
		r = circle[2];
	}
	// using a shorthand array
	else if (circle.length === 1) {
		x = 0;
		y = 0;
		r = circle[1]
	}
	// just a single number
	else if (isNumber(circle)) {
		x = 0;
		y = 0;
		r = circle;
	}
	// no matches
	else return;

	// update the spawn type
	config.spawnType = 'circle';
	config.spawnCircle = { x, y, r };
}

// creates a rectangular point
// last param is optional, otherwise creates a box
function defineRectangleBounds(config, rect) {
	let x, y, w, h;
	
	// parameter options
	if (rect.length === 4) {
		x = rect[0];
		y = rect[1];
		w = rect[2];
		h = rect[3];
	}
	else if (rect.length === 3) {
		x = rect[0];
		y = rect[1];
		w = h = rect[2];
	}
	else if (rect.length === 2) {
		x = 0;
		y = 0;
		w = rect[0];
		h = rect[1];
	}
	else if (rect.length === 1) {
		x = 0;
		y = 0;
		w = h = rect[1];
	}
	else  if (isNumber(rect)) {
		x = 0;
		y = 0;
		w = h = rect;
	}
	// no matches
	else return;

	// create the rect
	config.spawnType = 'rect';
	config.spawnRect = {
		w, h,
		x: x - (w / 2),
		y: y - (h / 2),
	};
}



// NOTE: This overrides default PIXI Particles behavior
// there is not way to define a random start rotation
// but we can capture the init call and use that to 
// apply a random rotation, if any
const __init = Particles.Particle.prototype.init;
Particles.Particle.prototype.init = function (...args) {
	
	// perform normal initialzation
	__init.apply(this, args);
	
	// check for a random start direction
	const { noRotation, randomStartRotation } = this.emitter.config;
	if (!noRotation && randomStartRotation) {
		const [min, max] = randomStartRotation;
		const angle = (Math.random() * (max - min)) + min;
		this.rotation = (Math.random() * TAU) * angle;
	}
};
