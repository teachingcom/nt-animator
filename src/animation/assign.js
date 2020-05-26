
import { noop, appendFunc } from '../utils';
import { createDynamicExpression, isDynamic } from './expressions';
import ResponsiveStage from '../pixi/stage';
import { MAPPINGS } from './mappings';

const DYNAMIC_PROPERTY_DEFAULTS = {
	x: 0,
	y: 0,
	z: 0,
	rotation: 0,
	skewX: 0,
	skewY: 0,
	pivotX: 0,
	pivotY: 0,
	scaleX: 1,
	scaleY: 1,
};



/** executes an assignment function only when the condtion passes */
export function assignIf(value, condition, target, action, ...args) {
	if (condition(value)) action(target, value, ...args);
}


/** assigns common properties for a display object */
export function assignDisplayObjectProps(target, props) {
	if (!props) return;

	// update each property
	for (const mapping of MAPPINGS) {
		if (props[mapping.prop] !== undefined) {
			mapping.apply(target, props[mapping.prop]);
		}
	}

	// for (const id in props) {
	// 	const mapping = MAPPINGS[id];
	// 	if (mapping) {
	// 		mapping(target, props[id]);
	// 	}
	// 	else {
	// 		console.warn('No mapping found for', id);
	// 	}
	// }
}


/** handles adding dynamically rendered properties */
export function applyDynamicProperties(obj, props) {
	if (!props) return;

	let hasDynamicProperties = false;
	let update = noop;

	// check and map all dynamic props
	for (const id in props) {
		if (isDynamic(props[id])) {
			const handler = createDynamicExpression(id, props);
			hasDynamicProperties = true;

			// append the update function
			update = appendFunc(update, handler);
			props[id] = DYNAMIC_PROPERTY_DEFAULTS[id];
		}
	}

	// if nothing was found, just skip
	if (!hasDynamicProperties) {
		return;
	}

	// create the handler function
	const updateProperties = () => {
		const stage = ResponsiveStage.findResponsiveStage(obj);
		update(obj, stage);
	};

	// set the initial values
	updateProperties();

	// override the existing render function
	const __render__ = obj.render;
	obj.render = (...args) => {
		updateProperties();

		// render normally
		return __render__.apply(obj, args);
	};

}