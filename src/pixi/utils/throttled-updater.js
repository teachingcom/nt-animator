
// shared animation loop
const throttled = {
  frame: 0,
  elapsed: Date.now(),
  updates: []
}

// update all throttled animations
function updateAll () {
  requestAnimationFrame(updateAll)
  throttled.frame++

  // update the timing
  const now = Date.now()
  const delta = now - throttled.elapsed
  throttled.elapsed = now

  // update each
  for (let i = throttled.updates.length; i-- > 0;) {
    try {
      throttled.updates[i](throttled.frame, delta)
    } catch (ex) { }
  }
}

// kick off update loop
updateAll()

// // handles creating an throttled updater for animations
// export function createThrottledAnimationUpdater (...args) {
//   return createThrottledUpdater('animationUpdateFrequency', args)
// }

// // handles creating a throttled updater for emitters
// export function createThrottledEmitterUpdater (...args) {
//   return createThrottledUpdater('emitterUpdateFrequency', args)
// }

// handles creating a throttled updater for emitters
export function createThrottledUpdater (key, animator, ...args) {
  const { action, scale } = resolveArgs(args)

  // update on the appropriate frames
  const update = (frame, delta) => {
    if (frame % animator.options[key] !== 0) {
      return
    }
    action(delta * scale)
  }

  // add to the update queue
  throttled.updates.push(update)

  // return a stopper
  return () => {
    const index = throttled.updates.indexOf(update)
    throttled.updates.splice(index, 1)
  }
}

// resolve optional args
function resolveArgs (args) {
  let [scale, action] = args

  // no scaling was provided
  if (isNaN(scale)) {
    action = scale
    scale = 1
  }

  return { scale, action }
}
