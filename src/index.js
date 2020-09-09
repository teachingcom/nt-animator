// skips hello messages for PIXI
import './pixi/utils/skip-hello';

// animation helper
export { Animator } from './animation';
export { default as animate } from './animate';

// PIXI helpers
import ResponsiveContainer from './pixi/responsive';
import ResponsiveStage from './pixi/stage';
import DetatchedContainer from './pixi/detatched-container';
export const PIXI = { ResponsiveContainer, ResponsiveStage, DetatchedContainer };

// helpful utils
export { default as loadImage } from './animation/resources/loadImage';
export { EventEmitter } from './common/event-emitter';
export { getBoundsForRole } from './pixi/utils/get-bounds-of-role';
export { findDisplayObjectsOfRole } from './pixi/utils/find-objects-of-role';
export { createContext, createPlaceholderImage } from './utils/graphics';
export { removeDisplayObject } from './pixi/utils/remove';
