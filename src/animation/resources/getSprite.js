import getSpritesheet from "./getSpritesheet";

/** handles getting ain image from a spritesheet */
export default async function getSprite(animator, spritesheetId, imageId) {
	const spritesheet = await getSpritesheet(animator, spritesheetId);
	return spritesheet[imageId];
}
