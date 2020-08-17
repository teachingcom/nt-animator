import loadImage from "./loadImage";

// handle loading an external spritesheet
export default async function loadSpritesheet(animator, spritesheetId, spritesheet, ext) {

	// load the image first
	// for now, only expect PNG images
	const url = `${animator.baseUrl}${spritesheetId}.${ext}`;
	const image = await loadImage(url);

	// with the image, create slices based on the spritesheet
	if (!spritesheet.__initialized__)
		generateSprites(image, spritesheetId, spritesheet, ext);
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

		// get the bounds
		const [ x, y, width, height, type ] = record;

		// make sure it's for the image type used
		if (type !== ext) continue;
		
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
		ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

		// replace the bounds
		spritesheet[id] = canvas;
	}
}
