import loadImage from "./loadImage";

// handle loading an external spritesheet
export default async function loadSpritesheet(animator, spritesheetId, spritesheet) {

	// load the image first
	// for now, only expect PNG images
	const url = `${animator.baseUrl}${spritesheetId}.png`;
	const image = await loadImage(url);

	// with the image, create slices based on the spritesheet
	if (!spritesheet.__initialized__)
		generateSprites(image, spritesheetId, spritesheet);
}

// create individual sprites from an image
function generateSprites(image, spritesheetId, spritesheet) {

	// create each sprite slice
	for (const id in spritesheet) {
		const [ x, y, width, height ] = spritesheet[id];
		
		// match the canvas
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		// extra data (debugging)
		canvas.setAttribute('spritesheet', spritesheetId);
		canvas.setAttribute('sprite', id);

		// draw the sprite
		const ctx = canvas.getContext('2d');
		ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

		// replace the bounds
		spritesheet[id] = canvas;
	}

	// spritesheet is ready for use
	spritesheet.__initialized__ = true;
}
