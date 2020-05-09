import * as pop from 'popmotion';
import deep from 'deep-get-set';
import cloneDeep from "clone-deep";
import { unpack, inheritFrom } from "../utils";
import { isNumber, isArray, noop } from "../../utils";
import { assignDisplayObjectProps, toEasing, assignEmitterProps, evaluateDisplayObjectExpressions } from '../assign';
import { evaluateExpression } from '../expressions';

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

	// used to update sub properties
	const isEmitter = layer.type === 'emitter';

	// update function
	let updater = noop;
	layer.animations = [ ];
	

	// create each animation
	for (let i = 0; i < animations.length; i++) {
		try {

			// unpack any variables
			const animation = cloneDeep(animations[i]);
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
				duration = 1000,
				ease
			} = animation;
			const easings = toEasing(ease);

			// check for how to repeat the animation - if it's a flip then
			// we're just going to use the flip value
			const repeating = !!flip ? flip : loop;
			const config = {
				timings: [ ],
				values: keyframes || sequence || [ ],
				elapsed: evaluateExpression(elapsed, duration) || 0,
				easings,
				duration,

				// TODO: research how this works
				// flip will cause an aniation to loop as well as loop, but
				// it simply plays the animation backwards. Setting them
				// both causes the "flip" to wait until "loop" finishes, which
				// when you use Infinity, it never happens
				[flip === true ? 'flip' : 'loop']: isNumber(repeating) ? repeating : Infinity
			};

			// copy all default values for the starting frame
			const starting = { };

			//TODO: create an update mapper to improve performance

			// create a timings parameter
			for (let i = 0; i < config.values.length; i++) {
				const keyframe = config.values[i];

				// get the timing value, if any
				const timing = isNumber(keyframe.at) ? keyframe.at : i / config.values.length;
				config.timings.push(timing);

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
					}

					// evaluate any expressions
					keyframe[prop] = evaluateExpression(keyframe[prop], starting[prop]);
				}
			}

			// include the starting frame of animation
			// and also shift timings to account for
			// the extra frame of animation
			config.values.unshift(starting);
			config.timings.push(1);

			// create the animation that assigns
			// property values
			// TODO: research the "merge" function for Popmotion
			const handler = pop.keyframes(config);
			handler.start({
				update: update => {
					assignDisplayObjectProps(instance, update);

					// assign any emitter changes
					if (isEmitter) {
						assignEmitterProps(instance.emitter, update);
					}

				}
			});

			// return the animation object
			// track the object
			// return handler;


		}
		// make it clear which animation failed
		catch (ex) {
			console.error(`failed to create animation ${i}`);
			throw ex;
		}

	}

	return updater;
}
