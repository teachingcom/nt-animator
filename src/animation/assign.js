import * as PIXI from 'pixi.js';
import * as pop from 'popmotion';
import { isString, isNumber, isArray, TAU, RAD } from '../utils';
import { evaluateExpression } from './expressions';

/** executes an assignment function only when the condtion passes */
export function assignIf(value, condition, target, action, ...args) {
	if (condition(value)) action(target, value, ...args);
}

// calculations
export const toColor = value => {
		
	// already a hex string
	if (isString(value)) return value;

	// parse decimals as hex
	const hex = parseInt(value, 10).toString(16);
	return '000000'.substr(hex.length) + hex;
};

export const toRotation = rotation => rotation * RAD;
export const toBlendMode = mode => PIXI.BLEND_MODES[mode.toUpperCase()] || PIXI.BLEND_MODES.NORMAL;
export const toAnimationSpeed = fps => fps / 60;
export const toEasing = ease => {
	
	// allow for a complex bezier
	if (isArray(ease))
		return pop.easing.cubicBezier(...ease);

	// looks wacky, but it's juset converting snake case to
	// camel case and prefixing with "ease"
	// so, "in_out" or "inOut" becomes "easeInOut"
	else if (isString(ease)) {
		ease = ease.replace(/\_.{1}/g, (str) => str.substr(1).toUpperCase());
		if (ease.substr(0, 4) !== 'ease')
			ease = `ease` + ease[0].toUpperCase() + ease.substr(1);
	}

	// check for an easing or just use linear
	return pop.easing[ease] || pop.easing.linear
};

/** common pixi property assignments */
export const setX = (t, v) => t.x = v;
export const setY = (t, v) => t.y = v;
export const setZ = (t, v) => t.zIndex = v;
export const setAlpha = (t, v) => t.alpha = v;
export const setTint = (t, v) => t.tint = v;
export const setRotation = (t, v) => t.rotation = toRotation(v);
export const setFps = (t, v) => t.animationSpeed = toAnimationSpeed(v);
export const setBlendMode = (t, v) => t.blendMode = toBlendMode(v);
export const setRelativeX = (t, v, relativeTo) => t.x = v * relativeTo;
export const setRelativeY = (t, v, relativeTo) => t.y = v * relativeTo;

/** assigns common properties for a display object */
export function assignDisplayObjectProps(target, props) {
	if (!props) return;
	
	// positions
	assignIf(props.x, isNumber, target, setX);
	assignIf(props.y, isNumber, target, setY);
	assignIf(props.z, isNumber, target, setZ);
	assignIf(props.tint, isNumber, target, setTint);
	assignIf(props.rotation, isNumber, target, setRotation);
	assignIf(props.fps, isNumber, target, setFps);
	assignIf(props.blend, isString, target, setBlendMode);

	// alpha
	props.alpha = props.alpha || props.opacity;
	assignIf(props.alpha, isNumber, target, setAlpha);
	
	// origin
	assignIf(props.pivotX, isNumber, target.pivot, setRelativeX, target.width);
	assignIf(props.pivotY, isNumber, target.pivot, setRelativeY, target.height);

	// scale
	assignIf(props.scaleX, isNumber, target.scale, setX);
	assignIf(props.scaleY, isNumber, target.scale, setY);
}

/** handle assigning emitter values 
 * add more props as they make sense to include
*/
export function assignEmitterProps(target, props) {
	assignIf(props['emit.y'], isNumber, target, (t, v) => t.spawnPos.y = v);
	assignIf(props['emit.x'], isNumber, target, (t, v) => t.spawnPos.x = v);
}

/** evaluates dynamic expression for display objects */
export function evaluateDisplayObjectExpressions(props) {
	if (!props) return;
	props.x = evaluateExpression(props.x);
	props.y = evaluateExpression(props.y);
	props.rotation = evaluateExpression(props.rotation);
	props.scaleX = evaluateExpression(props.scaleX);
	props.scaleY = evaluateExpression(props.scaleY);
	props.pivotX = evaluateExpression(props.pivotX);
	props.pivotY = evaluateExpression(props.pivotY);
}
