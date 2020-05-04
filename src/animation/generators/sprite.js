import * as PIXI from 'pixi.js';

import createAnimation from './animation';
import resolveImages from '../resources/resolveImages';

import { assignDisplayObjectProps, evaluateDisplayObjectExpressions } from '../assign';
import { setDefaults, noop, map } from '../../utils';

// default parameters to create a sprite
const SPRITE_DEFAULTS = {
	alpha: 1,
	rotation: 0,
	scaleY: 1,
	scaleX: 1,
	pivotX: 0.5,
	pivotY: 0.5,
	x: 0,
	y: 0
};

/** creates a sprite instance */
export default async function createSprite(animator, path, composition, layer) {

	// recursively built update function
	let update = noop;

	// tracking setup phase
	let phase = '';
	try {

		// gather all required images
		phase = 'resolving images';
		const images = await resolveImages(animator, path, composition, layer);

		// create textures for each sprite
		phase = 'generating textures';
		const textures = map(images, img => PIXI.Texture.from(img));
		
		// create the instance of the sprite
		phase = 'creating sprite instance';
		const isAnimated = images.length > 1;
		const sprite = isAnimated
			? new PIXI.AnimatedSprite(textures)
			: new PIXI.Sprite(textures[0]);

		// if animated, start playback
		if (isAnimated) sprite.play();

		// set some default values
		sprite.pivot.x = sprite.width / 2;
		sprite.pivot.y = sprite.height / 2;

		// prepare expressions
		evaluateDisplayObjectExpressions(layer.props);

		// set defaults
		setDefaults(layer, 'props', SPRITE_DEFAULTS);
		
		// prepare data
		assignDisplayObjectProps(sprite, layer.props);

		// setup animations, if any
		phase = 'creating animations';
		sprite.animation = createAnimation(animator, path, composition, layer, sprite);

		// attach the update function
		return [{ displayObject: sprite, data: layer, update }];
	}
	catch(ex) {
		console.error(`Failed to create sprite ${path} while ${phase}`);
		throw ex;
	}

}
