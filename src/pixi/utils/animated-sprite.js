import { PIXI } from '../lib'

// for some reason, PIXI can cause animations animated sprites from playing
// this is a temporary solution that ensures animations play
export default function createAnimatedSpriteHelper (sprite, props) {
  let frequency
  let nextFrame
  let fps

  // do this when the frame is updated
  sprite.updateTransform = function () {
    const now = Date.now()

    // if the FPS has changed
    if (fps !== props?.fps) {
      fps = props.fps

      // determine how often to update the keyframes
      frequency = 1000 / (props?.fps || 60)
    
      // keeping track of the next time to cycle
      nextFrame = now + frequency
    }

    // if not paused and it's time to move
    // to the next frame, if needed
    if (fps > 0 && now > nextFrame) {
      nextFrame = now + frequency
      sprite.gotoAndStop(sprite.currentFrame + 1)
    }

    // use the normal update
    PIXI.AnimatedSprite.prototype.updateTransform.apply(sprite, arguments)
  }
}
