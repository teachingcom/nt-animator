
// defaults to standard Math random function
let randomizer = Math

export function random () {
  return randomizer.random()
}

/** assigns a randomizer to use for the random expression */
export function setRandomizer (val) {
  randomizer = val
}
