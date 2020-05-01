import * as pop from 'popmotion';
import deep from 'deep-get-set';
import cloneDeep from "clone-deep";
import { unpack } from "../utils";
import { isNumber } from "../../utils";
import { assignDisplayObjectProps, toEasing, assignEmitterProps } from '../assign';

// creates an animation
export default function createAnimation(animator, path, composition, layer, instance) {
	if (!layer.animation) return;

	// used to update sub properties
	const isEmitter = layer.type === 'emitter';

	// unpack any variables
	layer.animation = cloneDeep(layer.animation);
	unpack(animator, composition, layer, 'animation');

	// start creating the popmotion animation
	const { keyframes, sequence, loop = Infinity, duration = 1000, ease } = layer.animation;
	const easings = toEasing(ease);
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

				// TODO: this part is confusing -- special layer configurations
				// can create animations using their prop name and sub property, but
				// by default animations can simply use a property by their name
				// for example, an emitter can change "emit.x" to tween a sub property
				// however, rotation is simply "rotation" and not "props.rotation"
				starting[prop] = !!~prop.indexOf('.')
					? deep(layer, prop)
					: layer.props[prop];
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

			// assign any emitter changes
			if (isEmitter) {
				assignEmitterProps(instance.emitter, update);
			}

		}
	});

	// return the animation object
	return handler;
}
