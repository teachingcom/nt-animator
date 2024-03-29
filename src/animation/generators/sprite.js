import { PIXI } from '../../pixi/lib';

import createAnimation from './animation';
import resolveImages from '../resources/resolveImages';

import { assignDisplayObjectProps, applyExpressions, applyDynamicProperties } from '../assign';
import { setDefaults, noop, isNumber } from '../../utils';
import createTextureFromImage from '../resources/createTextureFromImage';
import { map } from '../../utils/collection';
import { normalizeProps } from '../normalize';
import { toRole } from '../utils';
import createAnimatedSpriteHelper from '../../pixi/utils/animated-sprite';


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

		// create the required sprite
		let sprite;
		if (isSprite) {

			// gather all required images
			phase = 'resolving images';
			const textures = await resolveImages(animator, path, composition, layer);

			// create the instance of the sprite
			phase = 'creating sprite instance';
			const isAnimated = textures.length > 1;
			sprite = isAnimated ? new PIXI.AnimatedSprite(textures)
					: new PIXI.Sprite(textures[0]);

			// set other values
			sprite.loop = layer.props?.loop !== false;
			sprite.isSprite = true;
			sprite.autoPlay = false;
			sprite.isAnimatedSprite = isAnimated;
			
			// choose the correct starting frame
			const startFrame = layer.props?.startFrame;
			if (isAnimated && startFrame) {
				const goto = startFrame === 'random' ? (0 | (Math.random() * textures.length))
				: isNumber(startFrame) ? startFrame
				: 0;

				sprite.gotoAndStop(goto);
			}

			// do not use built in animation engine
			// has strange behaviors when multiple
			// instances are active
			if (isAnimated && layer.autoplay !== false) {
				createAnimatedSpriteHelper(sprite, layer.props);
			}
		}
		// markers act like normal sprites and are used to define
		// bounds and positions without needing an actual sprite
		else if (isMarker) {
			sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
			sprite.visible = false;
		}

		// shared data
		sprite.role = toRole(layer.role);
		sprite.path = path;

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
			if (layer.debug) {
				sprite.visible = true;
				sprite.alpha = layer.debug ? (layer.props.alpha || layer.debug || 1) : NaN;
				if (isNaN(sprite.alpha)) {
					sprite.alpha = 1;
				}
			}
			
			// scale to match the preferred pixel sizes
			sprite.scale.x = (layer.props?.width || sprite.width) / sprite.width;
			sprite.scale.y = (layer.props?.height || sprite.height) / sprite.height;
		}

		// add to the controller
		controller.register(sprite);
		sprite.config = layer;

		// attach the update function
		return [{ displayObject: sprite, data: layer, update, dispose }];
	}
	catch(ex) {
		console.error(`Failed to create sprite ${path} while ${phase}`);
		console.error(ex)
		throw ex;
	}

}

