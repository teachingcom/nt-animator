import fastCopy from 'fast-copy';
import deepDefaults from 'deep-defaults';

import { isString, isIterable } from "../utils";
import { parsePath, resolvePath } from "./path";
import { RecursiveLimitExceededException } from "./errors";
import { evaluateExpression } from './expressions';

/** inherits properties from an animation node */
export function inheritFrom(animator, composition, layer, prop) {
	let base = layer[prop];
	if (!base) return;

	// eval as needed
	base = evaluateExpression(base);

	// apply the inherited properties
	const basedOn = clone(animator, composition, base);
	deepDefaults(layer, basedOn);
	layer.basedOn = base;
	return layer;
}

/** clones an individual data node */
export function clone(animator, data, path) {
	if (isString(path)) {
		path = parsePath(path);
	}

	const source = path.isAbsolute ? animator.manifest : data;
	const cloned = resolvePath(source, path.parts);
	return fastCopy(cloned);
}

/** converts a role string to an array */
export function toRole(str) {
	return (str || '').split(/ +/g);
}


/** expands out a node to clone all data refs */
export function unpack(animator, root, source, prop, limit = 0) {
	if (++limit > 10) {
		throw new RecursiveLimitExceededException();
	}

	// get the value to check
	const obj = prop ? source[prop] : source;
	
	// check to resolve a path
	if (isString(obj)) {
		const ref = parsePath(obj);

		// if this refers to cloning local data
		if (ref.isRelative) {
			source[prop] = clone(animator, root, ref);

			// recurisvely unpack looking for
			// other cloned refs
			unpack(animator, root, source, prop, limit);
		}
	}
	// if this is a collection, perform this for
	// each of the properties
	else if (isIterable(obj)) {
		for (const id in obj) {
			unpack(animator, root, obj, id, limit);
		}
	}
}
