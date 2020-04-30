import * as PIXI from 'pixi.js';
import * as Particles from 'pixi-particles';

import { assignIf, toBlendMode } from "../assign";
import { isNumber, noop, map, appendFunc, setDefaults, isString } from "../../utils";

import resolveImages from "../resources/resolveImages";
import createAnimation from './animation';

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

		const MAPPINGS = {
			alpha: { props: ['start', 'end'], allowList: true },
			scale: { props: ['start', 'end'], allowList: true },
			color: { props: ['start', 'end'], allowList: true },
			speed: { props: ['start', 'end'], allowList: true },
			dir: { props: ['min', 'max'], renameTo: 'startRotation' },
			rotationSpeed: { props: ['min', 'max'] },
			life: { props: ['min', 'max'], renameTo: 'lifetime' }
		};

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
			//  to be relative to the total position
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
		assignIf(emit.startDir, isNumber, config, (t, v) => t.angleStart = v);
		assignIf(emit.type, isString, config, (t, v) => t.spawnType = v);
		assignIf(emit.blend, isString, config, (t, v) => t.blendMode = toBlendMode(v));
		config.noRotation = !!config.noRotation;
		config.atBack = !!config.atBack;
		config.orderedArt = !!config.orderedArt;

		// check for emission bounds
		phase = 'defining emitter bounds';

		// is a radial spawn
		if ('circle' in emit) {
			const [x, y, r] = emit.circle;
			config.spawnType = 'circle';
			config.spawnCircle = { x, y, r };
		}
		// is a rectangle spawn
		else if ('rect' in emit) {
			const [x, y, w, h] = emit.rect;
			config.spawnType = 'rect';
			config.spawnRect = { x, y, w, h };
		}
		// default to a point
		else {
			config.pos = { x: 0, y: 0 };
		}

		// create the emitter
		phase = 'creating emitter instance';
		const container = new PIXI.Container();
		const emitter = new Particles.Emitter(container, textures, config);

		// set container defaults
		setDefaults(layer, 'props', EMITTER_DEFAULTS);
		Object.assign(container, layer.props);

		// animate, if needed
		phase = 'creating animation';
		container.animation = createAnimation(animator, composition, layer, container);

		// attach the update function
		return [{ displayObject: container, update }];
	}
	catch(ex) {
		console.error(`Failed to create emitter ${path} while ${phase}`);
		throw ex;
	}

}