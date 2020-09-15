import { PIXI } from '../../pixi/lib';
import loadImage from "./loadImage";


// handle loading an external spritesheet
export default async function loadSpritesheet(animator, spritesheetId, spritesheet, ext) {

	// load the image first
	// for now, only expect PNG images
	const url = `${animator.baseUrl}${spritesheetId}.${ext}`;
	
	// attempt to load the image
	const image = await loadImage(url);

	// prepare the spritesheet
	if (!spritesheet.__initialized__) {

		// if the image failed to load, and we're not using placeholder
		// images, then crash here
		if (!image && !animator.ignoreImageLoadErrors)
			throw new ImageRequestFailedException();
		
		// create a spritesheet with the image. If the image is
		// null then placeholders will be created with
		// the same dimensions
		generateSprites(image, spritesheetId, spritesheet, ext);
	}
}

// create individual sprites from an image
// TODO: consider converting to async or JIT since it seems
// to be a little slow on chromebooks
function generateSprites(image, spritesheetId, spritesheet, ext) {
	const base = PIXI.Texture.from(image);

	// create each sprite slice
	for (const id in spritesheet) {
		const record = spritesheet[id];
		
		// if this is not an array, skip it
		if (!Array.isArray(record)) continue;
		
		// make sure it's for the image type used
		const [ x, y, width, height, type ] = record;
		if (type !== ext) continue;

		// save the texture
		const rect = new PIXI.Rectangle(x, y, width, height);
		const texture = new PIXI.Texture(base, rect);
		spritesheet[id] = texture;
	}

}

function ImageRequestFailedException() { }