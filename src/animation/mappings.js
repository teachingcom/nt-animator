import { toRotation, toAnimationSpeed, toBlendMode, toRelative } from "./converters";


// checks for emitter pivots
function detectPivot(obj, value, relativeTo) {
	return value * (obj.isEmitter ? 1 : relativeTo);
}

/** gets a mapping using a property name */
export function lookup(prop) {
	const mapping = LOOKUP[prop];
	if (!mapping) {
		throw new Error(`Mapping ${prop} was not found`);
	}
	return mapping;
}

/** a series of mapping from a property name to PIXI object value */
export const MAPPINGS = [
	
	// transforms
	{ prop: 'x', apply: (t, v) => t.x = v },
	{ prop: 'y', apply: (t, v) => t.y = v },
	{ prop: 'z', apply: (t, v) => t.zIndex = v },
	{ prop: 'rotation', apply: (t, v) => t.rotation = toRotation(v) },

	// animation
	{ prop: 'fps', apply: (t, v) => t.animationSpeed = toAnimationSpeed(v) },
	// { prop: '// currentFrame', apply: ? }?
	
	// colors and styling
	{ prop: 'alpha', apply: (t, v) => t.alpha = v },
	{ prop: 'opacity', apply: (t, v) => t.alpha = v },
	{ prop: 'blend', apply: (t, v) => t.blendMode = toBlendMode(v) },
	{ prop: 'blendMode', apply: (t, v) => t.blendMode = toBlendMode(v) },
	{ prop: 'tint', apply: (t, v) => t.tint = v },

	// { prop: 'hue', apply: (t, v) => t.tint = v },
	
	// layer pivoting
	{ prop: 'pivotX', apply: (t, v) => t.pivot.x = detectPivot(t, v, t.width) },
	{ prop: 'pivotY', apply: (t, v) => t.pivot.y = detectPivot(t, v, t.height) },

	// layer scaling
	{ prop: 'scaleX', apply: (t, v) => t.scale.x = v },
	{ prop: 'scaleY', apply: (t, v) => t.scale.y = v },

	// layer scaling
	{ prop: 'skewX', apply: (t, v) => t.skew.x = v },
	{ prop: 'skewY', apply: (t, v) => t.skew.y = v },

	// emitter props
	{ prop: 'emit.y', apply: (t, v) => t.emitter.spawnPos.y = v },
	{ prop: 'emit.x', apply: (t, v) => t.emitter.spawnPos.x = v },

	// emitter bounds (rectangles)
	{ prop: 'emit.rect.width', apply: (t, v) => t.emitter.spawnRect.width = v },
	{ prop: 'emit.rect.height', apply: (t, v) => t.emitter.spawnRect.height = v },
	{ prop: 'emit.rect.x', apply: (t, v) => t.emitter.spawnRect.x = v },
	{ prop: 'emit.rect.y', apply: (t, v) => t.emitter.spawnRect.x = v },

];


// quick lookup table
const LOOKUP = { };
for (const mapping of MAPPINGS)
	LOOKUP[mapping.prop] = mapping.apply;
