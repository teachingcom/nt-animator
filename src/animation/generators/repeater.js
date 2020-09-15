import { PIXI } from '../../pixi/lib';

import createAnimation from './animation';

import { assignDisplayObjectProps, applyDynamicProperties, applyExpressions } from '../assign';
import { setDefaults, noop, isNumber, appendFunc, isString } from '../../utils';
import { getBoundsForRole } from '../../pixi/utils/get-bounds-of-role';

// for creating child instances
import createInstance from '.';
import { evaluateExpression } from '../expressions';
import { normalizeProps, normalizeTo } from '../normalize';
import { unpack, toRole } from '../utils';

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
	const root = animator.lookup(path);

	// recursively built update function
	let update = noop;
	let dispose = noop;

	// tracking setup phase
	let phase = '';
	try {

		// if the composition refers to a path
		if (isString(layer.compose)) {
			unpack(animator, root, layer);
		}

		// NOTE: sprites are added a wrapper container on purpose
		// because any animations that modify scale will interfere
		// with scaling done to fit within responsive containers
		const container = new PIXI.Container();
		container.isRepeater = true;
		container.role = toRole(layer.role);
		container.path = path;
		
		// create the instance of the group (each group should
		// have it's own compose prop)
		phase = 'creating repeater contents';
		const tiles = new PIXI.Container();

		// fix prop names
		normalizeTo(layer, 'repeatX', 'cols', 'columns');
		normalizeTo(layer, 'repeatY', 'rows');
		normalizeTo(layer, 'jitterX', 'jitter.x');
		normalizeTo(layer, 'jitterY', 'jitter.y');

		// identify the repeating pattern
		const columns = isNumber(layer.repeatX) ? layer.repeatX : 1;
		const rows = isNumber(layer.repeatY) ? layer.repeatY : 1;
		const originX = evaluateExpression(layer.props?.x || 0);
		const originY = evaluateExpression(layer.props?.y || 0);

		// check for defined distances
		let useOffsetX = false;
		let offsetX = 0;
		if ('offsetX' in layer) {
			offsetX = evaluateExpression(layer.offsetX || 0);
			useOffsetX = true;
		}

		let useOffsetY = false;
		let offsetY = 0;
		if ('offsetY' in layer) {
			offsetY = evaluateExpression(layer.offsetY || 0);
			useOffsetY = true;
		}

		// check for jitter values
		let useJitterX = false;
		let jitterX = 0;
		if ('jitterX' in layer) {
			jitterX = evaluateExpression(layer.jitterX || 0);
			useJitterX = true;
		}

		let useJitterY = false;
		let jitterY = 0;
		if ('jitterY' in layer) {
			jitterY = evaluateExpression(layer.jitterY || 0);
			useJitterY = true;
		}

		// do we still need bounds for each section?
		const needBounds = !(useOffsetX && useOffsetY);

		// create the scene using the sizing
		let bounds;
		for (let i = 0; i < columns * rows; i++) {
			const col = i % columns;
			const row = Math.floor(i / columns);

			// create the layer
			const instance = await createInstance(animator, controller, path, layer, root);
			tiles.addChild(instance);
			
			// include the dispose function
			dispose = appendFunc(dispose, instance.dispose);

			// if this is the first, tile then calculate the size
			if (needBounds && !bounds) {
				bounds = getBoundsForRole(instance, 'bounds');

				// if no bounds were detected
				if (!bounds) {
					bounds = instance.getBounds();
				}
			}

			
			// default position
			const x = originX;
			const y = originY;

			// apply offsets
			x += col * (useOffsetX ? offsetX : bounds.width);
			y += row * (useOffsetY ? offsetY : bounds.height);

			// check for jittering
			if (useJitterX) x += 0 | ((Math.random() * jitterX * 2) - jitterX);
			if (useJitterY) y += 0 | ((Math.random() * jitterY * 2) - jitterY);

			// include nudge
			x += evaluateExpression(layer.nudgeX || 0);
			y += evaluateExpression(layer.nudgeY || 0);

			instance.x = x;
			instance.y = y;
		}

		// sort the contents
		tiles.sortChildren();

		// sync up shorthand names
		normalizeProps(layer.props);

		// perform simple expressions
		phase = 'evaluating expressions';
		applyExpressions(layer.props);

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

		// check for custom sorting
		if (layer.sortBy) {

			// update each property
			for (const child of tiles.children) {
				child.zIndex = child[layer.sortBy] + 5000;
			}

			// sort again
			tiles.sortChildren();
		}

		// position
		tiles.x = complete.width / 2;
		tiles.y = complete.height / 2;

		// attach the update function
		return [{ displayObject: container, data: layer, update, dispose }];
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
