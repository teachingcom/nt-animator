import { PIXI as libPIXI } from './pixi/lib';

// skips hello messages for PIXI
import './pixi/utils/skip-hello';

// animation helper
export { Animator } from './animation';
export { default as animate } from './animate';

// PIXI helpers
import ResponsiveContainer from './pixi/responsive';
import ResponsiveStage from './pixi/stage';
import DetatchedContainer from './pixi/detatched-container';

// share libraries
export const PIXI = { ...libPIXI, ResponsiveContainer, ResponsiveStage, DetatchedContainer };

// helpful utils
export { default as loadImage } from './animation/resources/loadImage';
export { EventEmitter } from './common/event-emitter';
export { getBoundsForRole } from './pixi/utils/get-bounds-of-role';
export { findDisplayObjectsOfRole } from './pixi/utils/find-objects-of-role';
export { createAnimatedSpriteHelper } from './pixi/utils/animated-sprite';
export { createContext, createPlaceholderImage, drawPixiTexture } from './utils/graphics';
export { removeDisplayObject } from './pixi/utils/remove';
