
// installs a special 
export default function addTexture(animator, spriteId, texture) {
	const { spritesheets } = animator.manifest
  const spritesheet = spritesheets.textures = spritesheets.textures || { }
	spritesheet.__initialized__ = true
	spritesheet[spriteId] = texture
}