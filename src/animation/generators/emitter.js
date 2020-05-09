import * as PIXI from 'pixi.js';
import * as Particles from 'pixi-particles';
import { assignIf, toColor, evaluateDisplayObjectExpressions, assignDisplayObjectProps } from "../assign";
import { isNumber, noop, map, setDefaults, isString, isArray, RAD } from "../../utils";

import resolveImages from "../resources/resolveImages";
import createAnimation from './animation';

// emitter property mappings
const MAPPINGS = {
	alpha: { props: ['start', 'end'], displayAsList: true },
	scale: { props: ['start', 'end'], displayAsList: true },
	color: { props: ['start', 'end'], displayAsList: true, converter: toColor },
	speed: { props: ['start', 'end'], displayAsList: true },
	dir: { props: ['min', 'max'], renameTo: 'startRotation' },
	rotation: { props: ['min', 'max'], renameTo: 'rotationSpeed' },
	life: { props: ['min', 'max'], renameTo: 'lifetime' }
};

// default parameters to create a sprite
const EMITTER_DEFAULTS = {
	alpha: 1,
	rotation: 0,
	scaleY: 1,
	scaleX: 1,
	pivotX: 0.5,
	pivotY: 0.5,
	x: 0,
	y: 0,
	z: 0
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
		
		// prepare expressions
		evaluateDisplayObjectExpressions(layer.props);

		// generate a config -- pixi-particles uses a lot of
		// objects that are difficult to work with - nt-animator
		// just accepts arrays and shorthand names, but the need to
		// be converted - the list of mappings are at the top of the
		// file to make it easier to understand
		const config = { autoUpdate: true };
		const { emit = { } } = layer;

		// fix common naming mistakes
		if (emit.colors) {
			emit.color = emit.colors;
			emit.colors = undefined;
		}


		// update each property
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
			if (total > 2 && mapping.displayAsList) {
				assign = {
					list: map(assign, (value, i) => {
						if (mapping.converter) value = mapping.converter(value);
						return { value, time: i / (total - 1) };
					})
				};
			}
			// otherwise, just create a simple start/stop
			else {
				let [start, stop] = assign;

				// conversion, if any
				if (mapping.converter) {
					start = mapping.converter(start);
					stop = mapping.converter(stop);
				}

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
		assignIf(emit.freq, isNumber, config, (t, v) => t.frequency = 1 / v);
		assignIf(emit.chance, isNumber, config, (t, v) => t.spawnChance = v);
		assignIf(emit.type, isString, config, (t, v) => t.spawnType = v);
		
		// as it turns out, the library will look up the correct enum on its own
		assignIf(emit.blend, isString, config, (t, v) => t.blendMode = v);

		// boolean props
		config.noRotation = !!emit.noRotation;
		config.atBack = !!emit.atBack;
		config.orderedArt = !!emit.orderedArt;
		config.flipParticleX = !!emit.flipParticleX;
		config.flipParticleY = !!emit.flipParticleY;

		// if rotation is disabled
		if (emit.noRotation) {
			config.rotationSpeed = undefined;
		}

		// NOTE: Check the end of the file for overrides to Particle behavior
		// default to random starting rotations if not overridden
		if (!emit.noRotation) {

			// has a random start rotation range
			if (isNumber(emit.startRotation)) {
				config.hasDefinedStartRotation = true;
				config.definedStartRotation = emit.startRotation;
			}
			// if it's a range
			else if (isArray(emit.startRotation)) {
				config.randomStartRotation = emit.randomStartRotation;
			}
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

		// NOTE: emitters are added to one more container on purpose
		// because any animations that modify scale will interfere
		// with scaling done to fit within responsive containers
		const container = new PIXI.Container();

		// create the particle generator
		const generator = new PIXI.Container();
		generator.emitter = new Particles.Emitter(generator, textures, config);
		generator.emitter.config = config;
		container.addChild(generator);
		
		// set container defaults
		setDefaults(layer, 'props', EMITTER_DEFAULTS);
		assignDisplayObjectProps(generator, layer.props);

		// apply z-indexing
		container.zIndex = generator.zIndex;

		// animate, if needed
		phase = 'creating animation';
		generator.animation = createAnimation(animator, path, composition, layer, generator);

		// attach the update function
		return [{ displayObject: container, data: layer, update }];
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
	else if (circle.length === 2) {
		r = circle[0];
		x = circle[1];
		y = 0;
	}
	// using a shorthand array
	else if (circle.length === 1) {
		r = circle[0];
		x = 0;
		y = 0;
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
		w = rect[0];
		h = rect[1];
		x = rect[2];
		y = rect[3];
	}
	else if (rect.length === 3) {
		w = rect[0];
		h = rect[1];
		x = rect[2];
		y = 0;
	}
	else if (rect.length === 2) {
		w = rect[0];
		h = rect[1];
		x = 0;
		y = 0;
	}
	else if (rect.length === 1) {
		w = h = rect[0];
		x = 0;
		y = 0;
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




// NOTE: this overrides default PIXI behavior for particles
// There are several properties about particles that cannot be
// adjusted using the configuration. This overrides the update process
// to use the normal update sequence, but then apply additional
// modifiers
// Particles traveling to the left are flipped upside down since their
// "direction" is technically 180 degrees. This this change allows for
// sprites to have their images flipped or rotated based on a starting
// value. 
const __override_update__ = Particles.Particle.prototype.update;
Particles.Particle.prototype.update = function (...args) {
	
	// perform normal updateialzation
	__override_update__.apply(this, args);

	// apply the default starting rotation
	if (this.rotationModifier)
		this.rotation += this.rotationModifier;

	// allow sprite flipping on x axis
	if (this.emitter.config.flipParticleX && this.scale.x > 0)
		this.scale.x *= -1;

	// allow sprite flipping on y axis
	if (this.emitter.config.flipParticleY && this.scale.y > 0)
		this.scale.y *= -1;
	
};


/** NOTE: This will override default PIXI Particle behavior
 * When creating a new particle this will define random start
 * rotations for particles, if needed
 */
const DEFAULT_RANDOM_ROTATIONS = [ 0, 360 ];
const __override_init__ = Particles.Particle.prototype.init;
Particles.Particle.prototype.init = function (...args) {
	
	// perform normal updateialzation
	__override_init__.apply(this, args);

	// apply the default starting rotation
	const {
		rotationSpeed,
		randomStartRotation,
		hasDefinedStartRotation,
		definedStartRotation
	} = this.emitter.config;
	
	// has a defined start rotation
	if (hasDefinedStartRotation) {
		this.rotation = this.rotationModifier = definedStartRotation;
	}
	// has a random range of start rotations
	else if (randomStartRotation) {
		const [min, max] = randomStartRotation || DEFAULT_RANDOM_ROTATIONS;
		const angle = (Math.random() * (max - min)) + min;
		this.rotation = this.rotationModifier = angle * RAD;
	}
	// no rotation modification
	else {
		this.rotation = this.rotationModifier = 0;
	}

	// if there's a constant rotation applied, then
	// this should be every frame. otherwise, do it
	// once any stop
	if (!!rotationSpeed) {
		this.rotationModifier = undefined;
	}

};
