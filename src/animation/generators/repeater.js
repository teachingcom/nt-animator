import * as PIXI from 'pixi.js';

import createAnimation from './animation';

import { assignDisplayObjectProps, evaluateDisplayObjectExpressions, applyDynamicProperties } from '../assign';
import { setDefaults, noop, isNumber } from '../../utils';
import { getBoundsForRole } from '../../pixi/utils/get-bounds-of-role';

// for creating child instances
import createInstance from '.';
import { findDisplayObjectsOfRole } from '../../pixi/utils/find-objects-of-role';
import { evaluateExpression } from '../expressions';
import { normalizeProps, normalizeTo } from '../normalize';

// default parameters to create a sprite
const GROUP_DEFAULTS = {
	alpha: 1,
	rotation: 0,
	scaleY: 1,
	scaleX: 1,
	pivotX: 0.5,
	pivotY: 0.5,
	x: 0,
	y: 0
};

/** creates a repeater instance */
export default async function createRepeater(animator, controller, path, composition, layer) {

	// recursively built update function
	let update = noop;

	// tracking setup phase
	let phase = '';
	try {

		// NOTE: sprites are added a wrapper container on purpose
		// because any animations that modify scale will interfere
		// with scaling done to fit within responsive containers
		const container = new PIXI.Container();
		container.isRepeater = true;
		container.role = layer.role;
		container.path = path;
		
		// create the instance of the group (each group should
		// have it's own compose prop)
		phase = 'creating repeater contents';
		const tiles = new PIXI.Container();

		// fix prop names
		normalizeTo(layer, 'repeatX', 'cols', 'columns');
		normalizeTo(layer, 'repeatY', 'rows');

		// identify the repeating pattern
		const columns = isNumber(layer.repeatX) ? layer.repeatX : 1;
		const rows = isNumber(layer.repeatY) ? layer.repeatY : 1;

		// create the scene using the sizing
		let bounds;
		for (let i = 0; i < columns * rows; i++) {
			const col = i % columns;
			const row = Math.floor(i / columns);

			// create the layer
			const instance = await createInstance(animator, controller, path, layer);
			tiles.addChild(instance);

			// if this is the first, tile then calculate the size
			if (!bounds) {
				bounds = getBoundsForRole(instance, 'bounds');

				// if no bounds were detected
				if (!bounds) {
					bounds = instance.getBounds();
				}
			}

			// calculate values
			const marginX = evaluateExpression(layer.marginX || 0);
			const marginY = evaluateExpression(layer.marginY || 0);
			const offsetX = evaluateExpression(layer.offsetX || 0);
			const offsetY = evaluateExpression(layer.offsetY || 0);
			
			// set the position
			instance.x = (col * (bounds.width + marginX)) + offsetX;
			instance.y = (row * (bounds.height + marginY)) + offsetY;
		}

		// sort the contents
		tiles.sortChildren();

		// sync up shorthand names
		normalizeProps(layer.props);

		// create dynamically rendered properties
		phase = 'creating dynamic properties';
		applyDynamicProperties(tiles, layer.props);

		// set defaults
		phase = 'applying defaults';
		setDefaults(layer, 'props', GROUP_DEFAULTS);
		
		// prepare data
		phase = 'assigning object props';
		assignDisplayObjectProps(tiles, layer.props);

		// setup animations, if any
		phase = 'creating animations';
		createAnimation(animator, path, composition, layer, tiles);

		// add to the view
		container.zIndex = tiles.zIndex;
		container.addChild(tiles);

		// get the complete bounds
		let complete = getBoundsForRole(container, 'bounds');
		if (!complete) {
			complete = container.getBounds();
		}

		// position
		tiles.x = complete.width / 2;
		tiles.y = complete.height / 2;

		// attach the update function
		return [{ displayObject: container, data: layer, update }];
	}
	catch(ex) {
		console.error(`Failed to create group ${path} while ${phase}`);
		throw ex;
	}

}

/** recursively finds a layer that has an assigned pivot point */
function findPivot(container, pivot = { x: 0, y: 0 }) {
	
	// nothing to check
	if (!container) return pivot;

	// this pivot 
	const hasX = isNumber(container.pivot?.x) && container.pivot?.x !== 0;
	const hasY = isNumber(container.pivot?.y) && container.pivot?.y !== 0;

	// if this pivot point was already set
	if ((hasX || hasY) && pivot.x !== 0 && pivot.y !== 0) {
		pivot.didFindMultiplePivots = true;
	}
	// has an assigned pivot point
	else if (hasX || hasY) {
		pivot.x = container.pivot.x;
		pivot.y = container.pivot.y;
	}
	
	// if a pivot hasn't been found and there are
	// children, go ahead and check deeper
	if (!(pivot.x || pivot.y) && container.children) {
		for (const child of container.children) {
			findPivot(child, pivot);
		}
	}

	return pivot;
}
