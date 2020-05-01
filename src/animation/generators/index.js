import * as PIXI from 'pixi.js';
import cloneDeep from 'clone-deep';
import { inheritFrom } from '../utils';
import { appendFunc, noop } from '../../utils';

// types
import createSprite from './sprite';
import createEmitter from './emitter';

// creates an instance of a car
export default async function createInstance(animator, path, data) {
	
	// format the path
	path = path.replace(/^\/*/, '');
	
	// unpack all data
	const instance = cloneDeep(data);
	
	// create the instance container
	const container = new PIXI.Container();
	container.update = noop;
	
	// kick off creating each element
	const pending = [ ];
	for (const layer of instance.compose) {
		const { type } = layer;
		inheritFrom(animator, data, layer, 'base');

		// sprite layers
		if (type === 'sprite') {
			const sprite = createSprite(animator, path, data, layer);
			pending.push(sprite);
		}
		// particle emitters
		else if (type === 'emitter') {
			const emitter = createEmitter(animator, path, data, layer);
			pending.push(emitter);
		}
		// not a valid type
		else {
			console.error(`[compose] Unknown layer type "${type}"`);
		}

	}

	// wait for finished work
	const composite = await Promise.all(pending);

	// with all results, create the final object
	for (const comp of composite) {

		// add each element
		for (const layer of comp) {
			container.update = appendFunc(container.update, layer.update);
			container.addChild(layer.displayObject);
		}
	}

	// return the final layer
	return container;
}
