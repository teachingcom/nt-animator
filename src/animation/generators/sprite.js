import * as PIXI from 'pixi.js';

import createAnimation from './animation';
import resolveImages from '../resources/resolveImages';

import { assignDisplayObjectProps, evaluateDisplayObjectExpressions, applyDynamicProperties } from '../assign';
import { setDefaults, noop } from '../../utils';
import createTextureFromImage from '../resources/createTextureFromImage';
import { map } from '../../utils/collection';

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

		// create dynamically rendered properties
		phase = 'creating dynamic properties';
		applyDynamicProperties(sprite, layer.props);

		// prepare expressions
		phase = 'evaluating property expressions';
		evaluateDisplayObjectExpressions(layer.props);

		// set defaults
		phase = 'applying defaults';
		setDefaults(layer, 'props', SPRITE_DEFAULTS);
		
		// prepare data
		phase = 'assigning object props';
		assignDisplayObjectProps(sprite, layer.props);

		// setup animations, if any
		phase = 'creating animations';
		const animation = createAnimation(animator, path, composition, layer, sprite);

		// add to the view
		container.zIndex = sprite.zIndex;
		container.addChild(sprite);

		// attach the update function
		return [{ displayObject: container, data: layer, update, animation }];
	}
	catch(ex) {
		console.error(`Failed to create sprite ${path} while ${phase}`);
		throw ex;
	}

}
