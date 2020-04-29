
export function isArray(obj) {
	return Array.isArray(obj);
}

export function isObject(obj) {
	return typeof data === 'object';
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
