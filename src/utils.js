import cloneDeep from "clone-deep";

export const TAU = Math.PI * 2;
export const RAD = Math.PI / 180;

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

// single depth flattening
export function flatten(collection) {
	let items = [ ];

	for (let item of collection) {
		if (isArray(item)) items = items.concat(item);
		else items.push(item);
	}

	return items;
}

// simple map function
export function map(source, action) {
	const keep = [ ];
	if (isArray(source))
		for (let i = 0; i < source.length; i++)
			keep.push(action(source[i], i));

	else
		for (let i in source)
			keep.push(action(source[i], i));
	return keep;
}

/** waits for an event to happen */
export async function waitForEvent(obj, onEvent, onError, timeout) {
	return new Promise((resolve, reject) => {

		// create a timeout, if needed
		const wait = timeout || onError;
		const limit = isNumber(wait) && setTimeout(reject, wait);

		// clear the timeout when resolved
		const handle = (action) => (...args) => {
			clearTimeout(limit);
			action(...args);
		};

		// add each listener
		obj.addEventListener(onEvent, handle(resolve));
		if (onError) {
			obj.addEventListener(onError, handle(reject));
		}
	});
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
