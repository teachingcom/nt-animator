import * as PIXI from 'pixi.js';

import createAnimation from './animation';

import { assignDisplayObjectProps, evaluateDisplayObjectExpressions, applyDynamicProperties } from '../assign';
import { setDefaults, noop } from '../../utils';

// for creating child instances
import createInstance from '.';

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
export default async function createGroup(animator, path, composition, layer) {

	// recursively built update function
	let update = noop;

	// tracking setup phase
	let phase = '';
	try {

		// NOTE: sprites are added a wrapper container on purpose
		// because any animations that modify scale will interfere
		// with scaling done to fit within responsive containers
		const container = new PIXI.Container();
		container.role = layer.role;
		
		// create the instance of the group (each group should
		// have it's own compose prop)
		phase = 'creating group contents';
		const group = await createInstance(animator, path, layer);
		
		// sort the contents
		group.sortChildren();

		// create dynamically rendered properties
		phase = 'creating dynamic properties';
		applyDynamicProperties(group, layer.props);

		// prepare expressions
		phase = 'evaluating property expressions';
		evaluateDisplayObjectExpressions(layer.props);

		// set defaults
		phase = 'applying defaults';
		setDefaults(layer, 'props', GROUP_DEFAULTS);
		
		// prepare data
		phase = 'assigning object props';
		assignDisplayObjectProps(group, layer.props);

		// setup animations, if any
		phase = 'creating animations';
		const animation = createAnimation(animator, path, composition, layer, group);

		// add to the view
		container.zIndex = group.zIndex;
		container.addChild(group);

		// set some default values
		group.pivot.x = 0;
		group.pivot.y = 0;

		// attach the update function
		return [{ displayObject: container, data: layer, update, animation }];
	}
	catch(ex) {
		console.error(`Failed to create group ${path} while ${phase}`);
		throw ex;
	}

}
