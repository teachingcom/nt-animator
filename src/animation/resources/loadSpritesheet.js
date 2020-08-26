import loadImage from "./loadImage";
import { createPlaceholderImage } from "../../utils/graphics";


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

	// create each sprite slice
	for (const id in spritesheet) {
		const record = spritesheet[id];
		
		// if this is not an array, skip it
		if (!Array.isArray(record)) continue;
		
		// make sure it's for the image type used
		const [ x, y, width, height, type ] = record;
		if (type !== ext) continue;

		// create a generation function
		const generate = () => {
		
			// match the canvas
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;

			// // helper to display all textures and names
			// if (displayAllTextures) {
			// 	const label = document.createElement('h1');
			// 	label.textContent = id;
			// 	document.body.appendChild(label);
			// 	document.body.appendChild(canvas);
			// }

			// extra data (debugging)
			canvas.setAttribute('spritesheet', spritesheetId);
			canvas.setAttribute('sprite', id);

			// draw the sprite
			const ctx = canvas.getContext('2d');

			// try and draw the required sprite
			try {
				// an image was found
				if (!!image) {
					ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
				}
				// create a fake image
				else {
					createPlaceholderImage({ width, height, canvas, ctx });
				}
			}
			// if this failed, just draw a placeholder
			catch (ex) {
				createPlaceholderImage({ width, height, canvas, ctx });
			}

			
			// replaces the value
			canvas.isSprite = true;
			spritesheet[id] = canvas;
		};

		// save the generator
		spritesheet[id] = generate;
	}

}

function ImageRequestFailedException() { }