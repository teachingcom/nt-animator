import { isString } from "../utils";

/** creates a url from a reference */
export function createUrlFromRef(ref) {
	// nothing fancy, just remove the prefix
	return ref.path.substr(2);
}

/** parses a animation file path
 * TODO: cache path parsing?
*/
export function parsePath(path) {
	
	// identify the type
	const isUrl = path.substr(0, 2) === ':/';
	const isAbsolute = !isUrl && path.substr(0, 2) === '//';
	const isRelative = !isAbsolute && path.substr(0, 1) === '/';
	const isLocal = !(isAbsolute || isUrl || isRelative);

	// trim off the prefix
	const index = isUrl ? 2
		: isAbsolute ? 2
		: isRelative ? 1
		: 0;

	// create each part of the resource path
	const parts = path.substr(index).split(/\/+/g);

	return { path, parts, isAbsolute, isRelative, isLocal, isUrl };
}

/** resolves an animation path to a data element
 * TODO: cache path resolve?
 */
export function resolvePath(data, parts) {
	if (isString(parts)) {
		parts = parsePath(parts);
	}

	let block = data;
	for (let i = 0; i < parts.length; i++)
		block = block && block[parts[i]];
	return block;
}
