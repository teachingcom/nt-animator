import { PIXI } from '../../pixi/lib';

import createAnimation from './animation';

import { assignDisplayObjectProps, evaluateDisplayObjectExpressions, applyDynamicProperties, applyExpressions } from '../assign';
import { setDefaults, noop, appendFunc, isString } from '../../utils';
import { unpack, toRole } from '../utils';

// for creating child instances
import createInstance from '.';
import { normalizeProps } from '../normalize';
import { evaluateExpression } from '../expressions';

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

/** creates a group instance */
export default async function createGroup(animator, controller, path, composition, layer) {
	const root = animator.lookup(path);

	// recursively built update function
	let update = noop;
	let dispose = noop;

	// tracking setup phase
	let phase = '';
	try {
		// check for any expressions
		layer.compose = evaluateExpression(layer.compose)
		
		// if the composition refers to a path
		if (isString(layer.compose)) {
			unpack(animator, root, layer);
		}

		// NOTE: sprites are added a wrapper container on purpose
		// because any animations that modify scale will interfere
		// with scaling done to fit within responsive containers
		const container = new PIXI.Container();
		container.isGroup = true;
		container.role = toRole(layer.role);
		container.path = path;
		
		// create the instance of the group (each group should
		// have it's own compose prop)
		phase = 'creating group contents';
		const group = await createInstance(animator, controller, path, layer, root);

		// handle cleanup
		for (const child of group.children) {
			if (child.dispose)
				dispose = appendFunc(dispose, child.dispose);
		}

		// identify as a group
		container.isGroup = group.isGroup = true;
		
		// sort the contents
		group.sortChildren();

		// match up shorthand names
		normalizeProps(layer.props);

		// perform simple expressions
		phase = 'evaluating expressions';
		applyExpressions(layer.props);

		// create dynamically rendered properties
		phase = 'creating dynamic properties';
		applyDynamicProperties(group, layer.props);

		// set defaults
		phase = 'applying defaults';
		setDefaults(layer, 'props', GROUP_DEFAULTS);
		
		// prepare data
		phase = 'assigning object props';
		assignDisplayObjectProps(group, layer.props);

		// setup animations, if any
		phase = 'creating animations';
		createAnimation(animator, path, composition, layer, group);

		// add to the view
		container.config = layer;
		container.zIndex = group.zIndex;
		container.addChild(group);

		// set some default values
		group.pivot.x = 0;
		group.pivot.y = 0;

		// bakes a layer to a single object
		if (layer.merge) {
			group.cacheAsBitmap = true;
			group.batch = 'merged';
		}

		// include this instance
		controller.register(container);

		// attach the update function
		return [{ displayObject: container, data: layer, update, dispose }];
	}
	catch(ex) {
		console.error(`Failed to create group ${path} while ${phase}`);
		throw ex;
	}

}
