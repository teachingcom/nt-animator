import { PIXI } from '../pixi/lib';
import { isString, isNumber, isArray, RAD } from '../utils';
import { map } from '../utils/collection';

// calculations
export const toColor = value => {
		
	// already a hex string
	if (isString(value)) return value;

	// parse decimals as hex
	const hex = parseInt(value, 10).toString(16);
	return '000000'.substr(hex.length) + hex;
};


// makes a value relative to another
// TODO: how to make this convenient for pivot points
export const toRelative = (value, relativeTo) => {
	return value * relativeTo;
};


// misc values
export const toRotation = rotation => rotation * RAD;
export const toBlendMode = mode => PIXI.BLEND_MODES[mode.toUpperCase()] || PIXI.BLEND_MODES.NORMAL;
export const toAnimationSpeed = fps => fps / 60;

// creating the easing value
export const toEasing = ease => {
	
	// allow for a complex bezier
	if (isArray(ease)) {

		// if the first value is a number, assume cubic bezier
		if (isNumber(ease[0]))
			return `cubicBezier(${ease.join(',')})`;

		// otherwise, map each
		return map(ease, toEasing);
	}

	// looks wacky, but it's juset converting snake case to
	// camel case and prefixing with "ease"
	// so, "in_out" or "inOut" becomes "easeInOut"
	else if (isString(ease)) {

		// dont' convert this
		if (ease === 'linear') return ease;

		// format the names, just in case
		ease = ease.replace(/\_.{1}/g, (str) => str.substr(1).toUpperCase());
		if (ease.substr(0, 4) !== 'ease')
			ease = `ease` + ease[0].toUpperCase() + ease.substr(1);

		// TODO: fix animation files
		// missing required ending
		if (ease === 'easeIn' || ease === 'easeOut' || ease === 'easeInOut')
			ease += 'Quad';
	}

	// check for an easing or just use linear
	return ease;
};
