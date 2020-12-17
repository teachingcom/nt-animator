import { PIXI } from '../lib'

// for some reason, PIXI can cause animations animated sprites from playing
// this is a temporary solution that ensures animations play
export default function createAnimatedSpriteHelper (sprite, props) {
  // determine how often to update the keyframes
  const frequency = 1000 / (props?.fps || 60)

  // keeping track of the next time to cycle
  let nextFrame = Date.now() + frequency

  // do this when the frame is updated
  sprite.updateTransform = function () {
    const now = Date.now()

    // move to the next frame, if needed
    if (now > nextFrame) {
      nextFrame = now + frequency
      sprite.gotoAndStop(sprite.currentFrame + 1)
    }

    // use the normal update
    PIXI.AnimatedSprite.prototype.updateTransform.apply(sprite, arguments)
  }
}
