import * as PIXI from 'pixi.js';
import { InvalidTextureRequestException } from '../errors';

// internal texture cache
const TEXTURES = { };

/** handles creating a texture from an image */
export default function createTextureFromImage(img) {
	let spritesheet;
	let sprite;

	// attempt to load the texture
	try {
		if (!img) {
			throw new InvalidTextureRequestException();
		}

		// get sprite info
		spritesheet = img.getAttribute('spritesheet');
		sprite = img.getAttribute('sprite');
		const useCache = spritesheet && sprite;
		
		// texture to load
		let texture;

		// create the cache, if missing
		if (useCache) {
			TEXTURES[spritesheet] = TEXTURES[spritesheet] || { }
			texture = TEXTURES[spritesheet][sprite];
		}
		
		// if it exists, reuse it
		if (texture) {
			return texture;
		}
		
		// create the new texture
		texture = PIXI.Texture.from(img);
		texture.scaleMode = PIXI.SCALE_MODES.LINEAR;
		texture.mipmap = true;

		// cache, if needed
		if (useCache) {
			TEXTURES[spritesheet][sprite] = texture;
		}

		// return the result
		return texture;
	}
	// handle the error
	catch (ex) {
		// the image has data to work with
		if (sprite && spritesheet) {
			console.error(`failed to load ${sprite} from source ${spritesheet}`);
		}

		throw ex;
	}

}