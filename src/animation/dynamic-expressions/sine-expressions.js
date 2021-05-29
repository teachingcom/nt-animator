import { isObject } from '../../utils'
import * as mappings from '../mappings'

class BaseSineExpression {

  static start = Date.now()

  offset = 0
  scale = 1
  flip = 1

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)
    this.modifier = () => 1

    let min = 0
    let max = 1
    for (const arg of args) { 
      const isObj = isObject(arg)
      if (arg === 'int') {
        this.convertToInt = true
      }
      else if (arg === 'invert') {
        this.flip = -1
      }
      else if (isObj && 'min' in arg) {
        min = arg.min
      }
      else if (isObj && 'max' in arg) {
        max = arg.max
      }
      else if (isObj && 'relative_to_stage' in arg) {
        const key = arg.relative_to_stage
        this.modifier = (target, stage) => stage[key] || 0
      }
      else if (isObj && 'relative_to_self' in arg) {
        const key = arg.relative_to_self
        this.modifier = (target, stage) => target[key] || 0
      }
      else if (isObj && 'scale' in arg) { 
        this.scale = arg.scale * 0.01
      }
      else if (arg === 'stagger' || (isObj && arg.stagger)) { 
        this.offset += 0 | (arg.stagger || 10000) * Math.random()
      }
      else if (arg.offset) { 
        this.offset = arg.offset * 1000
      }
    }

    // if there's no max value then
    // max the range from 0-min
    if (isNaN(max)) { 
      max = min
      min = 0
    }
    
    // save the args
    this.min = min
    this.max = max
  }

  update = (target, stage) => {
    const ts = ((Date.now() - BaseSineExpression.start) + this.offset) * this.scale
    const sine = this.calc(ts) * this.modifier(target, stage)
    const percent = ((sine + 1) / 2)
		const value = (((percent * (this.max - this.min)) + this.min)) * this.flip
		this.mapping(target, (this.convertToInt ? 0 | value : value))
  }

}

export class CosineExpression extends BaseSineExpression {
	calc = Math.cos
}

export class SineExpression extends BaseSineExpression {
	calc = Math.sin
}