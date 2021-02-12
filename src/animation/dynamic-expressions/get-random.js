import * as mappings from '../mappings'
import * as randomizer from '../../randomizer'

export default class GetRandomExpression {
  constructor (prop, params) {
    this.mapping = mappings.lookup(prop)

    // sort out the params
    this.toInt = !~params.indexOf('decimal')
    this.isVariable = !!~params.indexOf('var')

    // extract the range to work with
    let [min, max] = params
    if (isNaN(max)) {
      max = min
      min = 0
    }

    // save the values
    this.max = max
    this.min = min

    if (!this.isVariable) {
      const value = this.next()
      this.update = (sprite) => this.mapping(sprite, value)
    }
  }

  // calculates the next value
  next = () => {
    const value = (randomizer.random() * (this.max - this.min)) + this.min
    return this.toInt ? 0 | value : value
  }

  // update the sprite
  update = (sprite, stage) => {
    const next = this.next()
    this.mapping(sprite, next)
  }
}
