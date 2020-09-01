import fastCopy from 'fast-copy';

// helper math values
export const TAU = Math.PI * 2;
export const RAD = Math.PI / 180;

/** checks if an object is non-null and not undefined */
export function isNil(obj) {
	return obj === null || obj === undefined;
}

/** checks if an object has a value */
export function isSet(obj) {
	return !isNil(obj);
}

/** checks if an object is an array */
export function isArray(obj) {
	return Array.isArray(obj);
}

/** checks if an object is just an object */
export function isObject(obj) {
	return typeof obj === 'object';
}

/** checks if an object can be iterated over */
export function isIterable(obj) {
	return isObject(obj) || isArray(obj);
}

/** checks if n object is a string */
export function isString(obj) {
	return typeof obj === 'string' || obj instanceof String;
}

/** checks if an object is a number */
export function isNumber(obj) {
	return typeof obj === 'number' || obj instanceof Number;
}

/** checks if an object is a boolean value */
export function isBoolean(obj) {
	return obj === true || obj === false;
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
		target[prop] = fastCopy(defaults);
		return;
	}

	// set each missing value
	for (const id in defaults) {
		if (assignTo[id] === undefined)
			assignTo[id] = defaults[id];
	}
}

/** Merges two functions into sequential calls */
export function appendFunc(baseFunction, includedFunction) {
	return includedFunction
		? (...args) => { baseFunction(...args); includedFunction(...args); }
		: baseFunction;
}
