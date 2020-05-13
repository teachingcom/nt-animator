import * as PIXI from 'pixi.js';
import cloneDeep from 'clone-deep';
import { inheritFrom } from '../utils';
import { appendFunc, noop, isString } from '../../utils';

// types
import createSprite from './sprite';
import createEmitter from './emitter';
import createGroup from './group';

// creates an instance of a car
export default async function createInstance(animator, path, data) {
	
	// format the path
	path = path.replace(/^\/*/, '');
	
	// unpack all data
	const instance = cloneDeep(data);
	inheritFrom(animator, data, instance, 'base');
	
	// create the instance container
	const container = new PIXI.Container();
	container.update = noop;
	
	// kick off creating each element
	const pending = [ ];
	for (const layer of instance.compose) {
		inheritFrom(animator, data, layer, 'base');
		
		// sprite layers
		const { type } = layer;
		if (type === 'sprite') {
			const sprite = createSprite(animator, path, data, layer);
			pending.push(sprite);
		}
		// particle emitters
		else if (type === 'group') {
			const group = createGroup(animator, path, data, layer);
			pending.push(group);
		}
		// particle emitters
		else if (type === 'emitter') {
			const emitter = createEmitter(animator, path, data, layer);
			pending.push(emitter);
		}
		// not a valid type
		else {

			// check for plugins
			const plugin = animator.plugins[type];
			if (plugin) {
				const custom = plugin(animator, path, data, layer);
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

	// a few additional tracking options
	container.instances = { };

	// tracking masks, if any
	const masks = [ ];

	// with all results, create the final object
	for (const composition of composite) {

		// add each element
		for (const layer of composition) {
			container.update = appendFunc(container.update, layer.update);
			container.addChild(layer.displayObject);

			// capture masks
			if ('masks' in layer.data) {
				masks.push(layer);
			}

			// set named instances, if fund
			const { role } = layer.data;
			if (role) {

				// warn of duplicate roles
				if (container.instances[role]) {
					console.error(`Duplicate layer role found "${role}" for ${path}`);
				}

				// save for later
				container.instances[role] = layer;
			}

		}
	}

	// TODO: this works, but it doesn't work with
	// alpha channels (not sure why), though it does seem
	// like it's supported
	for (const mask of masks) {
		const { data } = mask;
		const targets = isString(data.masks) ? [data.masks] : data.masks;
		for (const ref of targets) {
			const target = container.instances[ref];
			if (target) {
				target.displayObject.mask = mask.displayObject;
			}
		}
	}

	// update based on ordering
	container.sortChildren();

	// return the final layer
	return container;
}
