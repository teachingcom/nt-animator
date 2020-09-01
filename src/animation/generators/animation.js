// import * as pop from 'popmotion';
import fastCopy from 'fast-copy';
import { unpack, inheritFrom } from "../utils";
import { isNumber, isArray, noop, isNil } from "../../utils";
import { assignDisplayObjectProps } from '../assign';
import { evaluateExpression } from '../expressions';
import { toEasing } from '../converters';
import animate from '../../animate';

// creates an animation
export default function createAnimation(animator, path, composition, layer, instance) {

	// check for special debugging flags
	if (layer.animate === false) return;

	// find the source of animations
	let animations = [ ];
	if (isArray(layer.animations)) {
		animations = animations.concat(layer.animations);
	}
	else if (!!layer.animation) {
		animations = [layer.animation];
	}

	// without animations, just quit
	if (animations.length === 0) {
		return;
	}

	// update function
	let updater = noop;
	layer.animations = [ ];

	// create each animation
	for (let i = 0; i < animations.length; i++) {
		try {

			// unpack any variables
			const animation = fastCopy(animations[i]);
			inheritFrom(animator, composition, animation, 'base');

			// REFACTOR: don't create object just for array prop - 
			// consider allowing the "prop" for unpack to be an array index
			// unpack expects it to be part of the layer object
			unpack(animator, composition, { animation }, 'animation');

			// start creating the popmotion animation
			const {
				keyframes,
				sequence,
				loop = Infinity,
				flip = 0,
				elapsed = 0,
				yoyo = 0,
				duration = 1000,
				delay = 0,
				ease
			} = animation;
			const easings = toEasing(ease);

			// check for how to repeat the animation - if it's a flip then
			// we're just going to use the flip value
			const repeating = !!flip ? flip : loop;
			const repeatType = flip === true /* intentional */ ? 'flip' : 'loop';
			const config = {
				times: [ ],
				values: keyframes || sequence || [ ],
				elapsed: evaluateExpression(elapsed, duration) || 0,
				easings,
				duration,

				// TODO: research how this works
				// flip will cause an aniation to loop as well as loop, but
				// it simply plays the animation backwards. Setting them
				// both causes the "flip" to wait until "loop" finishes, which
				// when you use Infinity, it never happens
				[repeatType]: isNumber(repeating) ? repeating : Infinity
			};

			// check for a few special flags
			if (loop === false) config.loop = false;
			if (flip === false) config.flip = false;
			if (yoyo === false) config.yoyo = false;

			// copy all default values for the starting frame
			const starting = { };

			//TODO: create an update mapper to improve performance

			// create a timings parameter
			for (let i = 0; i < config.values.length; i++) {
				const keyframe = config.values[i];

				// get the timing value, if any
				const timing = isNumber(keyframe.at) ? keyframe.at : i / config.values.length;
				config.times.push(timing);

				// remove any timing helpers, if any
				delete keyframe.at;

				// copy all default values
				for (const prop in keyframe) {
					if (!(prop in starting)) {
						
						// TODO: Colors have special rules
						// using tint/hue shift/and Popmotion color tween rules

						// TODO: this part is confusing -- special layer configurations
						// can create animations using their prop name and sub property, but
						// by default animations can simply use a property by their name
						// for example, an emitter can change "emit.x" to tween a sub property
						// however, rotation is simply "rotation" and not "props.rotation"
						const isSubProperty = !!~prop.indexOf('.');
						starting[prop] = isSubProperty ? deep(layer, prop) : layer.props[prop];

						// without a value, there might be an error
						if (isNil(starting[prop])) {
							console.warn(`Missing starting animation prop for ${prop}. This might mean you're animating a property that doesn't have a known starting value`);
						}
					}

					// evaluate any expressions
					keyframe[prop] = evaluateExpression(keyframe[prop], starting[prop]);

					// for tint, create new properties for the 
					// transition and remove the keyframe prop. This
					// will allow the animation keyframe update to 
					// property animate the color change
					if (prop === 'tint') {
						keyframe.__animated_tint__ = decToHex(keyframe[prop]);
						
						if (starting[prop])
							starting.__animated_tint__ = decToHex(starting[prop]);

						delete keyframe.tint;
						delete starting.tint;
					}

				}
			}

			// include the starting frame of animation
			// and also shift timings to account for
			// the extra frame of animation
			config.values.unshift(starting);

			// this section is used to correct animation
			// timing errors - this could grow unweildy so 
			// consider throwing errors for future animation
			// errors as opposed to fixing in code
			if (config.times.length < config.values.length) {
				const first = config.times[0];

				// if the first value is not a zero, then we'll
				// assume the animation is missing it's start time
				if (first !== 0) {
					config.times.unshift(0);
				}
				// if it's already set to zero, but there
				// doesn't appear to be an ending time
				else if (first === 0) {
					config.times.push(1);
				}

			}

			// set the config values
			config.update = props => assignDisplayObjectProps(instance, props);
			config.delay = delay;
			
			// create the animation
			instance.hasAnimation = true;
			instance.animation = animate(config);

		}
		// make it clear which animation failed
		catch (ex) {
			console.error(`Failed to create animation ${i}`);
			if (ex instanceof TypeError) {
				console.error('You may be attempting to tween between a property that has no known start value. Either add a default value or assign the property for the animation');				
			}

			throw ex;
		}

	}

	return updater;
}


// TODO: move else where
function decToHex(dec) {
	const val = dec.toString(16);
	return [ '#', `000000`.substr(val.length), val].join('');
}
