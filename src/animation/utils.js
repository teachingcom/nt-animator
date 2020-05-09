import cloneDeep from "clone-deep";
import deepDefaults from 'deep-defaults';

import { isString, isIterable } from "../utils";
import { parsePath, resolvePath } from "./path";
import { RecursiveLimitExceededException } from "./errors";

/** inherits properties from an animation node */
export function inheritFrom(animator, composition, layer, prop) {
	const base = layer[prop];
	if (!base) return;

	// apply the inherited properties
	const basedOn = clone(animator, composition, base);
	deepDefaults(layer, basedOn);
	return layer;
}

/** clones an individual data node */
export function clone(animator, data, path) {
	if (isString(path)) {
		path = parsePath(path);
	}

	const source = path.isAbsolute ? animator.manifest : data;
	const cloned = resolvePath(source, path.parts);
	return cloneDeep(cloned);
}


/** expands out a node to clone all data refs */
export function unpack(animator, root, source, prop, limit = 0) {
	if (++limit > 10) {
		throw new RecursiveLimitExceededException();
	}

	// get the value to check
	const obj = source[prop];
	
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
