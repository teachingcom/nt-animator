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
import { evaluateExpression } from '../expressions';
import * as variables from '../variables';
import { findDisplayObjectsOfRole } from '../../pixi/utils/find-objects-of-role';
import { BLEND_MODES } from 'pixi.js';

// creates an instance of a car
export default async function createInstance(animator, controller, path, data, relativeTo) {
	// format the path
	path = path.replace(/^\/*/, '');
	
	// unpack all data
	const instance = fastCopy(data);
	if (data && 'base' in data)
		inheritFrom(animator, data, instance, 'base');

	// apply params to this instance
	if (instance.params) {
		applyParameters(instance)
	}

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
		if (type === 'var') {
			const value = evaluateExpression(layer.value);
			variables.save(layer.name, value);
		}
		else if (type === 'sprite' || type === 'marker') {
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
	}

	// mask assignment
	const masks = findDisplayObjectsOfRole(container, 'mask');
	for (const mask of masks) {
		const applyTo = findDisplayObjectsOfRole(container, `mask:${mask.name}`)
		for (const target of applyTo) {;
			target.filters = [mask.maskFilter]
		}
	}

	// update based on ordering
	container.sortChildren();

	// return the final layer
	return container;
}

function hasChildren(obj) {
	return typeof obj === 'object' || typeof obj === 'array' || obj instanceof Array || obj instanceof Object
}

function applyParameters(instance, params = instance.params) {
	for (const id in instance) {
		if (instance[id]?.[0] === ':param') {
			instance[id] = params[instance[id]?.[1]]
		}

		// check children
		if (hasChildren(instance[id])) {
			applyParameters(instance[id], params)
		}
	}
	
}