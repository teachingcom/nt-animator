import { isNil } from "../utils";

/** normaizes series of properties on an object */
export function normalizeProps(props) {
	if (!props) return;

	normalizeTo(props, 'scaleX', 'scale.x');
	normalizeTo(props, 'scaleY', 'scale.y');
	normalizeTo(props, 'pivotX', 'pivot.x');
	normalizeTo(props, 'pivotY', 'pivot.y');
	normalizeTo(props, 'alpha', 'opacity', 'transparency');
}


// finds the first value and normalizes it to the first argument
function normalizeTo(props, ...keys) {
	let value;

	// the preferred name is the first of the keys
	const [ preferredName ] = keys;

	// find the first non-null/undefined value
	for (const key of keys) {
		if (isNil(value)) value = props[key];
		delete props[key];
	}

	// save the value
	if (!isNil(value)) {
		props[preferredName] = value;
	}
}

