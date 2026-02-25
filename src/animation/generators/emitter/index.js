import { PIXI } from '../../../pixi/lib';
import * as Particles from 'pixi-particles';
import { assignIf, assignDisplayObjectProps, applyDynamicProperties, applyExpressions } from "../../assign";
import { isNumber, noop, setDefaults, isString, isArray, RAD, isBoolean } from "../../../utils";
import { map } from "../../../utils/collection";
import defineEmitterBounds from './bounds';
import { createThrottledUpdater } from '../../../pixi/utils/throttled-updater';

// apply PIXI rendering overrides
import './overrides';

import createAnimation from '../animation';
import resolveImages from "../../resources/resolveImages";
import { normalizeProps, normalizeEmit } from '../../normalize';
import { toColor } from '../../converters';
import { toRole } from '../../utils';

// emitter property mappings
const MAPPINGS = {
	alpha: { props: ['start', 'end'], displayAsList: true },
	scale: { props: ['start', 'end'], displayAsList: true },
	color: { props: ['start', 'end'], displayAsList: true, converter: toColor },
	speed: { props: ['start', 'end'], displayAsList: true },
	accel: { props: ['x', 'y'], displayAsList: true, renameTo: 'acceleration' },
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
	skewY: 0,
	skewX: 0,
	pivotX: 0.5,
	pivotY: 0.5,
	x: 0,
	y: 0,
	z: 0
};

/** creates an emitter instance */
export default async function createEmitter(animator, controller, path, composition, layer) {
	
	// NOTE: emitters are added to one more container on purpose
	// because any animations that modify scale will interfere
	// with scaling done to fit within responsive containers
	const container = new PIXI.Container();
	container.role = toRole(layer.role);
	container.path = path;

	// TODO: this can't be done without creating
	// problems with pivot points. Need to come back
	// and check why - for now the emitter itself 
	// is marked as "isEmitter"
	// container.isEmitter = true;

	// create the container for the emitter
	const generator = new PIXI.Container();

	// recursively built update function
	let update = noop;
	let dispose = noop;

	// tracking setup phase
	let phase = '';
	try {

		// perform simple expressions
		phase = 'evaluating expressions';
		applyExpressions(layer.props);

		// gather all required images
		phase = 'resolving images';
		const textures = await resolveImages(animator, path, composition, layer);

		// // create textures for each sprite
		// phase = 'generating textures';
		// let textures;
		// try {
		// 	textures = map(images, createTextureFromImage);
		// }
		// // had a problem
		// catch (ex) {
		// 	console.error(`Failed to create a texture for ${path}`, composition);
		// 	throw ex;
		// }
		
		// create the instance of the sprite
		phase = 'configuring emitter';
		
		// generate a config -- pixi-particles uses a lot of
		// objects that are difficult to work with - nt-animator
		// just accepts arrays and shorthand names, but the need to
		// be converted - the list of mappings are at the top of the
		// file to make it easier to understand
		const { emit = { } } = layer;
		const auto = layer.auto !== false && layer.autoStart !== false;
		const config = { autoUpdate: auto };

		// copy anything custom (maybe do work here)
		config.custom = emit.custom

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
				let start;
				let stop;

				// multi value
				if (isArray(assign)) {
					start = assign[0];
					stop = assign[1];
				}
				// single value
				else {
					start = stop = assign;
				}

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
		assignIf(emit.duration, isNumber, config, (t, v) => t.emitterLifetime = v / 1000);
		assignIf(emit.delay, isNumber, config, (t, v) => t.delay = v);
		
		// this is established using shorthands for bounds
		// assignIf(emit.type, isString, config, (t, v) => t.spawnType = v);
		
		// as it turns out, the library will look up the correct enum on its own
		assignIf(emit.blend, isString, config, (t, v) => t.blendMode = v);

		// boolean props
		const manualStart = layer.auto === false || layer.autoPlay === false || emit.auto === false || emit.autoplay === false || emit.autoPlay === false;
		config.noRotation = !!emit.noRotation;
		config.addAtBack = !!emit.atBack;
		config.orderedArt = !!emit.orderedArt;
		config.hueShift = !!emit.hueShift;
		config.flipParticleX = !!(emit.flipParticleX || emit.flipX || emit['flip.x']);
		config.flipParticleY = !!(emit.flipParticleY || emit.flipY || emit['flip.y']);
		config.randomFlip = emit.randomFlip;

		if ('tint' in emit) {
			config.hasAssignedTint = true;
			config.tint = emit.tint;
		}

		// check for animated trail sequences
		let sequences = [ ];
		if (layer.sequences || layer.sequence) {

			// normalize to any array of sequences
			let source = layer.sequences || layer.sequence;
			if (!isArray(source)) {
				source = [ source ];
			}

			// build out each sequence
			for (const sequence of source) {

				// create each sequence
				const frames = [ ];

				// append each frame
				for (const frame of sequence.frames) {
					const texture = textures.find(item => item.identity === frame);
					frames.push({
						texture: texture,
						count: 1
					});
				}

				// add the animation
				sequences.push({
					loop: sequence.loop !== false,
					framerate: sequence.fps,
					textures: frames
				})
			}

		}

		// if rotation is disabled
		if (config.noRotation) {
			config.rotationSpeed = undefined;
		}

		// NOTE: Check the end of the file for overrides to Particle behavior
		// default to random starting rotations if not overridden
		else {

			// has a random start rotation range
			if (isNumber(emit.startRotation)) {
				config.hasDefinedRotationOffset = true;
				config.definedRotationOffset = emit.startRotation * RAD;
			}
			// if it's a range
			else if (isArray(emit.startRotation)) {
				config.hasRandomStartRotation = true;
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
		defineEmitterBounds(config, emit);

		// create the emitter
		phase = 'creating emitter instance';

		// create the particle generator
		let emitter;
		if (sequences.length) {
			emitter = new Particles.Emitter(generator, sequences, config);
			emitter.particleConstructor = Particles.AnimatedParticle;
		}
		else {
			emitter = new Particles.Emitter(generator, textures, config);
		}
		dispose = () => emitter.destroy();
		
		// save some properties
		emitter.config = config;
		container.emitter = emitter;
		container.addChild(generator);

		// the generator also may need access
		generator.emitter = emitter;
		generator.isEmitter = true;

		// fix property names to account for aliases
		normalizeProps(layer.props);
		normalizeEmit(layer.emit);

		// create the emitter
		let create = () => {
			emitter.autoUpdate = false;
			emitter.emit = true;

			createThrottledUpdater('emitterUpdateFrequency', animator, 0.001, delta => {
				emitter.update(delta * animator.options.emitterUpdateFrequency);
			});
		}

		// manual start
		if (manualStart || config.delay) {
			emitter.autoUpdate = false;
			emitter.emit = false;
			
			// create activation function
			emitter.activate = create;
		}

		const hasDelay = !isNaN(config.delay) && config.delay > 0

		// if manual start, but includes a delay
		if (manualStart && hasDelay) {
			const createFn = create
			create = () => setTimeout(createFn, config.delay)
			emitter.activate = create;
		}
		// delayed start
		else if (!manualStart && hasDelay) {
			setTimeout(create, config.delay);
		}
		// create immediately
		else if (!manualStart) {
			create()
		}

		// create dynamically rendered properties
		phase = 'creating dynamic properties';
		applyDynamicProperties(generator, layer.props);

		// set container defaults
		setDefaults(layer, 'props', EMITTER_DEFAULTS);
		assignDisplayObjectProps(generator, layer.props);

		// apply z-indexing
		container.zIndex = generator.zIndex;

		// animate, if needed
		phase = 'creating animation';
		createAnimation(animator, path, composition, layer, generator);

		// include this instance
		controller.register(generator);
		container.config = layer;

		// attach the update function
		return [{ displayObject: container, data: layer, update, dispose }];
	}
	catch(ex) {
		console.error(`Failed to create emitter ${path} while ${phase}`);
		throw ex;
	}

}
