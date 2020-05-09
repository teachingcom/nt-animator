import loadSpritesheet from "./loadSpritesheet";

// loads a spritesheet into memory
export default async function getSpritesheet(animator, spritesheetId) {

	// get the spritesheet instance
	const spritesheet = animator.manifest.spritesheets[spritesheetId];

	// check if the spritesheet needs to be created
	if (!spritesheet.__initialized__)
		await loadSpritesheet(animator, spritesheetId, spritesheet);

	// done
	return spritesheet;
}
