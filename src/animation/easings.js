/** @param {number} t 0-1 */
export function linear (t) {
  return t
}

/** @param {number} t 0-1 */
export function easeIn (t) {
  return t * t * t
}

/** @param {number} t 0-1 */
export function easeOut (t) {
  return 1 - Math.pow(1 - t, 3)
}

/** @param {number} t 0-1 */
export function easeInQuad (t) {
  return t * t
}

/** @param {number} t 0-1 */
export function easeOutQuad (t) {
  return t * (2 - t)
}

const easings = {
  linear,
  in: easeIn,
  out: easeOut,
  inQuad: easeInQuad,
  outQuad: easeOutQuad
}

/** @param {string|Function} ease */
export function resolveEasing (ease) {
  if (typeof ease === 'function') return ease
  return easings[ease] || linear
}

export default easings
