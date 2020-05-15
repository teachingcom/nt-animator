import cloneDeep from "clone-deep";

export const TAU = Math.PI * 2;
export const RAD = Math.PI / 180;

export function isNil(obj) {
	return obj === null || obj === undefined;
}

export function isSet(obj) {
	return !isNil(obj);
}

export function isArray(obj) {
	return Array.isArray(obj);
}

export function isObject(obj) {
	return typeof obj === 'object';
}

export function isIterable(obj) {
	return isObject(obj) || isArray(obj);
}

export function isString(obj) {
	return typeof obj === 'string' || obj instanceof String;
}

export function isNumber(obj) {
	return typeof obj === 'number' || obj instanceof Number;
}


/** non-action function */
export const noop = () => { };

/** assigns default values to another object
 * NOTE: this is a shallow copy
 */
export function setDefaults(target, prop, defaults) {
	let assignTo = target[prop];

	// nothing has been assigned
	if (!assignTo) {
		target[prop] = cloneDeep(defaults);
		return;
	}

	// set each missing value
	for (const id in defaults) {
		if (assignTo[id] === undefined)
			assignTo[id] = defaults[id];
	}
}

/** Merges two functions into sequential calls */
export function appendFunc(orig, append) {
	return (...args) => { orig(...args); append(...args); }
}
