import { isObject } from '../../utils'
import * as mappings from '../mappings'
import { resolveEasing } from '../easings'

function lerp (from, to, t) {
  return from * (1 - t) + to * t
}

export default class CycleExpression {

  static start = Date.now()

  offset = 0

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)
    this.modifier = () => 1

		let values = []
		let interval = 1000
    let ease

    for (const arg of args) { 
      const isObj = isObject(arg)
      if (arg === 'int') {
        this.convertToInt = true
      }
      else if (isObj && 'ease' in arg) {
        ease = arg.ease
      }
      else if (isObj && 'interval' in arg) {
        interval = arg.interval
      }
      else if (isObj && 'values' in arg) {
        values = arg.values
      }
      else if (arg === 'stagger' || (isObj && arg.stagger)) { 
        this.offset += 0 | (arg.stagger || 10000) * Math.random()
      }
      else if (arg.offset) { 
        this.offset = arg.offset * 1000
      }
    }
    
    // save the args
    this.interval = interval
    this.values = values
		this.valueCount = this.values.length

    if (ease) {
      this.easeFn = resolveEasing(ease)
    }
  }

  update = (target, stage) => {
		const now = Date.now()
		const step = ((now + this.offset) - CycleExpression.start) / this.interval
    const index = 0 | (step % this.valueCount)

    let value
    if (this.easeFn) {
      const next = this.values[(index + 1) % this.valueCount]
      const t = this.easeFn(step - (0 | step))
      value = lerp(this.values[index], next, t)
    } else {
      value = this.values[index]
    }

		this.mapping(target, (this.convertToInt ? 0 | value : value))
  }

}
