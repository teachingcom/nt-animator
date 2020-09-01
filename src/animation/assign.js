
import { noop, appendFunc } from '../utils';
import { createDynamicExpression, isDynamic, evaluateExpression } from './expressions';
import ResponsiveStage from '../pixi/stage';
import { MAPPINGS } from './mappings';

const MISSING_STAGE = { width: 0, height: 0 };
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
	anchorX: 0.5,
	anchorY: 0.5,
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
}


/** evaluates simple expressions */
export function applyExpressions(obj) {
	for (const prop in obj) {
		obj[prop] = evaluateExpression(obj[prop]);
	}
}


/** handles adding dynamically rendered properties */
export function applyDynamicProperties(obj, props) {
	if (!props) return;

	let hasDynamicProperties = false;
	let update = noop;

	// handling locked scaled?
	// TODOL is this needed?
	obj.startingScaleY = obj.height;

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
	
	// check for special functions
	if (props.lockWidth) {
		hasDynamicProperties = true;

		// create the update function
		update = appendFunc(update, (obj, stage) => {			
			obj.scale.x = Math.min(10, (obj.width / obj.getBounds().width) * (props.scaleX || 1)) * (stage.scaleX || 1);
		});
	}
	
	// check for special functions
	if (props.lockHeight) {
		hasDynamicProperties = true;

		// create the update function
		update = appendFunc(update, (obj, stage) => {			
			obj.scale.y = Math.min(10, (obj.height / obj.getBounds().height) * (props.scaleY || 1)) * (stage.scaleY || 1);
		});
	}

	// if nothing was found, just skip
	if (!hasDynamicProperties) {
		return;
	}

	// create the handler function
	const updateProperties = () => {
		let stage = obj.__responsiveStage__ = obj.__responsiveStage__ || ResponsiveStage.findResponsiveStage(obj);
		update(obj, stage || MISSING_STAGE);
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