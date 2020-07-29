import * as PIXI from 'pixi.js';

import createAnimation from './animation';
import resolveImages from '../resources/resolveImages';

import { assignDisplayObjectProps, applyExpressions, applyDynamicProperties } from '../assign';
import { setDefaults, noop } from '../../utils';
import createTextureFromImage from '../resources/createTextureFromImage';
import { map } from '../../utils/collection';
import { normalizeProps } from '../normalize';
import { toRole } from '../utils';

// default parameters to create a sprite
const SPRITE_DEFAULTS = {
	alpha: 1,
	rotation: 0,
	scaleY: 1,
	scaleX: 1,
	skewY: 0,
	skewX: 0,
	pivotX: 0.5,
	pivotY: 0.5,
	tint: 0xffffff,
	x: 0,
	y: 0
};

/** creates a sprite instance */
export default async function createSprite(animator, controller, path, composition, layer) {

	// recursively built update function
	let update = noop;
	let dispose = noop;

	// tracking setup phase
	let phase = '';
	try {
		const { type } = layer;
		const isSprite = type === 'sprite';
		const isMarker = !isSprite;

		// NOTE: sprites are added a wrapper container on purpose
		// because any animations that modify scale will interfere
		// with scaling done to fit within responsive containers
		const container = new PIXI.Container();
		container.isSprite = true;
		container.role = toRole(layer.role);
		container.path = path;

		// create the required sprite
		let sprite;
		if (isSprite) {

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
			sprite = isAnimated
				? new PIXI.AnimatedSprite(textures)
				: new PIXI.Sprite(textures[0]);

			// set other values
			// console.log('control loo[', layer.props>)
			sprite.loop = layer.props?.loop !== false;

			// if animated, start playback
			container.isAnimatedSprite = isAnimated;
			if (isAnimated) {
				sprite.play();
				
				// disposal
				dispose = () => sprite.stop();
			}
		}
		// markers act like normal sprites and are used to define
		// bounds and positions without needing an actual sprite
		else if (isMarker) {
			sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
		}

		// set some default values
		sprite.pivot.x = sprite.width / 2;
		sprite.pivot.y = sprite.height / 2;

		// sync up shorthand names
		normalizeProps(layer.props);

		// perform simple expressions
		phase = 'evaluating expressions';
		applyExpressions(layer.props);

		// create dynamically rendered properties
		phase = 'creating dynamic properties';
		applyDynamicProperties(sprite, layer.props);

		// set defaults
		phase = 'applying defaults';
		setDefaults(layer, 'props', SPRITE_DEFAULTS);
		
		// prepare data
		phase = 'assigning object props';
		assignDisplayObjectProps(sprite, layer.props);

		// setup animations, if any
		phase = 'creating animations';
		createAnimation(animator, path, composition, layer, sprite);

		// few additional adjustments
		if (isMarker) {
			sprite.alpha = layer.debug ? 0.5 : 0;
			
			// scale to match the preferred pixel sizes
			sprite.scale.x = (layer.props?.width || sprite.width) / sprite.width;
			sprite.scale.y = (layer.props?.height || sprite.height) / sprite.height;
		}

		// add to the view
		container.zIndex = sprite.zIndex;
		container.addChild(sprite);

		// add to the controller
		controller.register(container);

		// attach the update function
		return [{ displayObject: container, data: layer, update, dispose }];
	}
	catch(ex) {
		console.error(`Failed to create sprite ${path} while ${phase}`);
		throw ex;
	}

}
