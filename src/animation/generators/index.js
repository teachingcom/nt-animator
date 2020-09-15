import { PIXI } from '../../pixi/lib';
import fastCopy from 'fast-copy';
import { inheritFrom } from '../utils';
import { appendFunc, noop } from '../../utils';

// types
import createSprite from './sprite';
import createEmitter from './emitter';
import createGroup from './group';
import createMask from './mask';
import { flatten } from '../../utils/collection';
import createRepeater from './repeater';

// creates an instance of a car
export default async function createInstance(animator, controller, path, data, relativeTo) {
	// format the path
	path = path.replace(/^\/*/, '');
	
	// unpack all data
	const instance = fastCopy(data);
	if (data && 'base' in data)
		inheritFrom(animator, data, instance, 'base');

	// create the instance container
	const container = new PIXI.Container();
	container.update = noop;
	container.dispose = noop;
	
	// kick off creating each element
	const pending = [ ];

	// do this in reverse so layering, by default, matches
	// the contents of the file
	for (let i = instance.compose.length; i-- > 0;) {
		const layer = instance.compose[i];
		inheritFrom(animator, relativeTo || data, layer, 'base');
		delete layer.base;

		// check if hidden
		if (!!(layer.hide || layer.hidden)) continue;
		
		// sprite layers
		const { type } = layer;
		if (type === 'sprite' || type === 'marker') {
			const sprite = createSprite(animator, controller, path, data, layer);
			pending.push(sprite);
		}
		// particle emitters
		else if (type === 'emitter') {
			const emitter = createEmitter(animator, controller, path, data, layer);
			pending.push(emitter);
		}
		// repeating composition
		else if (type === 'repeater') {
			const repeated = createRepeater(animator, controller, path, data, layer);
			pending.push(repeated);
		}
		// object groups
		else if (type === 'group') {
			const group = createGroup(animator, controller, path, data, layer);
			pending.push(group);
		}
		// masking effects
		else if (type === 'mask') {
			const mask = createMask(animator, controller, path, data, layer);
			pending.push(mask);
		}
		// not a valid type
		else {

			// check for plugins
			const { customizer, params } = animator.plugins[type];
			if (customizer) {
				const custom = customizer(animator, controller, path, { ...data, params }, layer);
				pending.push(custom);
			}
			// unable to create this type
			else {
				console.error(`[compose] Unknown layer type "${type}"`);
			}
		}

	}

	// wait for finished work
	const composite = await Promise.all(pending);
	const layers = flatten(composite);

	// append each layer
	for (let i = layers.length; i-- > 0;) {
		const layer = layers[i];

		// add to the view
		container.update = appendFunc(container.update, layer.update);
		container.dispose = appendFunc(container.dispose, layer.dispose);
		container.addChildAt(layer.displayObject, 0);

		// if it's a mask, then apply to previous layers
		if (layer.displayObject.isMask) {
			let didSetMask = false;

			// loop backwards and apply the mask
			for (let j = i + 1; j < layers.length; j++) {
				const target = layers[j];

				// if the z-index for this layer is
				// above the mask, then ignore by default
				// TODO: would we like to add a property to allow
				// masks to work from the bottom?
				if ((target.displayObject.zIndex || 0) > (layer.displayObject.zIndex || 0))
					continue;

				// if ignoring the mask, don't bother
				if (!!target.data.ignoreMask || !!target.data.breakMask)
					continue;

				// apply the mask
				target.displayObject.mask = layer.displayObject;
				didSetMask = true;
			}

			// if there's an idle mask
			if (!didSetMask) {
				console.warn(`Unused mask created for ${path}. Mask will be hidden`);
				layer.displayObject.visible = false;
			}

		}

	}


	// update based on ordering
	container.sortChildren();

	// return the final layer
	return container;
}
