import loadSpritesheet from './loadSpritesheet'

// loads a spritesheet into memory
export default async function getSpritesheet (animator, spritesheetId) {
  // get the spritesheet instance
  const spritesheet = animator.manifest.spritesheets[spritesheetId]

  // check if the spritesheet needs to be created
  if (!spritesheet.__initialized__) {
    // queue up resource loading
    await Promise.all([
      spritesheet.hasJpg && loadSpritesheet(animator, spritesheetId, spritesheet, 'jpg'),
      spritesheet.hasPng && loadSpritesheet(animator, spritesheetId, spritesheet, 'png')
    ])

    // spritesheet is ready for use
    spritesheet.__initialized__ = true
  }

  // done
  return spritesheet
}
