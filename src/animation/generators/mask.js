import * as PIXI from 'pixi.js';

import createAnimation from './animation';

import { assignDisplayObjectProps, evaluateDisplayObjectExpressions, applyDynamicProperties } from '../assign';
import resolveImages from '../resources/resolveImages';
import createTextureFromImage from '../resources/createTextureFromImage';

import { setDefaults, noop } from '../../utils';
import { map } from '../../utils/collection';
import { InvalidMaskBoundsException } from '../errors';
import { createContext } from '../../utils/graphics';

// definging sprites by size requires scale to be set - in the
// event at user creates a mask that doesn't have an image, we're
// going to use a sprite generator to create a rectangle to
// match the bounds provided -- we might be able to use this to
// create more interesting masks (circles, rounded rects, paths)
// but in those cases it's probably easier just to import an image
const maskGenerator = createContext();

// default parameters to create a sprite
const MASK_DEFAULTS = {
	alpha: 1,
	rotation: 0,
	scaleY: 1,
	scaleX: 1,
	pivotX: 0.5,
	pivotY: 0.5,
	x: 0,
	y: 0
};

/** creates a mask instance */
export default async function createMask(animator, path, composition, layer) {

	// recursively built update function
	let update = noop;

	// tracking setup phase
	let phase = '';
	try {

		// NOTE: sprites are added a wrapper container on purpose
		// because any animations that modify scale will interfere
		// with scaling done to fit within responsive containers
		const container = new PIXI.Container();
		container.role = layer.role;
		
		// gather all required images
		phase = 'resolving images';
		const images = await resolveImages(animator, path, composition, layer);

		// create textures for each sprite
		phase = 'generating textures';
		let textures;
		try {
			textures = map(images, createTextureFromImage);
		}
		// had a problem
		catch (ex) {
			console.error(`Failed to create a texture for ${path}`, composition);
			throw ex;
		}
		
		// create the instance of the sprite
		phase = 'creating mask instance';

		// using bounds
		let mask;
		if (textures.length === 0) {

			// for non-sprite masks, bounds must be included
			if (isNaN(layer.width) || isNaN(layer.height) || layer.width === 0 || layer.height === 0) {
				phase = 'validating mask bounds';
				throw new InvalidMaskBoundsException();
			}
			
			// create the mask
			maskGenerator.canvas.width = layer.width;
			maskGenerator.canvas.height = layer.height;
			maskGenerator.ctx.fillStyle = 'white';
			maskGenerator.ctx.fillRect(0, 0, layer.width, layer.height);

			// create the sprite
			mask = new PIXI.Sprite.from(maskGenerator.canvas);
		}
		// is a sprite of some type
		else {
			const isAnimated = images.length > 1;
			mask = isAnimated
				? new PIXI.AnimatedSprite(textures)
				: new PIXI.Sprite(textures[0]);
	
			// if animated, start playback
			if (isAnimated) mask.play();
		}


		// create dynamically rendered properties
		phase = 'creating dynamic properties';
		applyDynamicProperties(mask, layer.props);

		// prepare expressions
		phase = 'evaluating property expressions';
		evaluateDisplayObjectExpressions(layer.props);

		// set defaults
		phase = 'applying defaults';
		setDefaults(layer, 'props', MASK_DEFAULTS);
		
		// prepare data
		phase = 'assigning object props';
		assignDisplayObjectProps(mask, layer.props);

		// setup animations, if any
		phase = 'creating animations';
		const animation = createAnimation(animator, path, composition, layer, mask);

		// add to the view
		container.zIndex = mask.zIndex;
		container.addChild(mask);
		container.isMask = true;

		// set some default values
		mask.pivot.x = mask.width / 2;
		mask.pivot.y = mask.height / 2;

		// attach the update function
		return [{ displayObject: container, data: layer, update, animation }];
	}
	catch(ex) {
		console.error(`Failed to create mask ${path} while ${phase}`);
		throw ex;
	}

}
