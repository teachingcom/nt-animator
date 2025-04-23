import { isNil } from "../utils";

/** normaizes series of properties on an object */
export function normalizeProps(props) {
	if (!props) return;

	normalizeTo(props, 'scaleX', 'scale.x');
	normalizeTo(props, 'scaleY', 'scale.y');
	normalizeTo(props, 'pivotX', 'pivot.x');
	normalizeTo(props, 'pivotY', 'pivot.y');
	normalizeTo(props, 'tileX', 'tile.x');
	normalizeTo(props, 'tileY', 'tile.y');
	normalizeTo(props, 'tileScaleX', 'tile.scale.x');
	normalizeTo(props, 'tileScaleY', 'tile.scale.y');
	normalizeTo(props, 'tileScale', 'tile.scale');
	normalizeTo(props, 'tileRotation', 'tile.rotation');
	normalizeTo(props, 'anchorX', 'anchor.x');
	normalizeTo(props, 'anchorY', 'anchor.y');
	normalizeTo(props, 'skewX', 'skew.x');
	normalizeTo(props, 'skewY', 'skew.y');
	normalizeTo(props, 'alpha', 'opacity', 'transparency');
	normalizeTo(props, 'roundPixels', 'snapToPixel', 'snapToGrid', 'snap');
}

export function normalizeEmit(emit) {
	if (!emit) return;
	
	// fix emitter props
	normalizeTo(emit, 'rotation', 'rotate');
	normalizeTo(emit, 'startRotation', 'startingRotation');
}


// finds the first value and normalizes it to the first argument
export function normalizeTo(props, ...keys) {
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

