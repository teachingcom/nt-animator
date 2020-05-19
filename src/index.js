
// animation helper
export { Animator } from './animation';

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
export { createContext } from './utils/graphics';