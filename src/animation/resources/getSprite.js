import getSpritesheet from "./getSpritesheet";

/** handles getting ain image from a spritesheet */
export default async function getSprite(animator, spritesheetId, imageId) {
	const spritesheet = await getSpritesheet(animator, spritesheetId);
	// const sprite = spritesheet[imageId];

	// check if this sprite has been generated
	// if (!sprite.isSprite) sprite();

	// return the reference
	return spritesheet[imageId];
}
