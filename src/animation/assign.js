import * as PIXI from 'pixi.js';
const TAU = Math.PI * 2;

/** executes an assignment function only when the condtion passes */
export function assignIf(value, condition, target, action, ...args) {
	if (condition(value)) action(target, value, ...args);
}

// calculations
export const toRotation = rotation => (rotation / 360) * TAU;
export const toBlendMode = mode => PIXI.BLEND_MODES[mode.toUpperCase()];
export const toAnimationSpeed = fps => fps / 60;

/** common pixi property assignments */
export const setX = (t, v) => t.x = v;
export const setY = (t, v) => t.y = v;
export const setZ = (t, v) => t.zIndex = v;
export const setAlpha = (t, v) => t.alpha = v;
export const setRotation = (t, v) => t.rotation = toRotation(v);
export const setFps = (t, v) => t.animationSpeed = toAnimationSpeed(v);
export const setBlendMode = (t, v) => t.blendMode = toBlendMode(v);
export const setRelativeX = (t, v, relativeTo) => t.x = v * relativeTo;
export const setRelativeY = (t, v, relativeTo) => t.y = v * relativeTo;