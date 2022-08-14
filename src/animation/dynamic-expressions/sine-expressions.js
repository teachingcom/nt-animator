import { isObject } from '../../utils'
import * as mappings from '../mappings'

class BaseSineExpression {

  static start = Date.now()

  cycle = 0
  offset = 0
  scale = 1
  flip = 1

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)
    this.modifier = () => 1

    this.sortLayers = this.prop === 'z';

    let min = 0
    let max = 1
    for (const arg of args) { 
      const isObj = isObject(arg)
      if (arg === 'round') {
        this.roundNumber = true
      }
      else if (arg === 'exact') {
        this.useExact = true
      }
      else if (arg === 'int') {
        this.convertToInt = true
      }
      else if (arg === 'invert') {
        this.flip = -1
      }
      else if (arg === 'inverse') {
        this.inverse = 1
      }
      else if (isObj && 'inverse' in arg) {
        this.inverse = arg.inverse || 1
      }
      else if (isObj && 'min' in arg) {
        min = arg.min
      }
      else if (isObj && 'max' in arg) {
        max = arg.max
      }
      else if (isObj && 'relative_to_stage' in arg) {
        const key = arg.relative_to_stage
        this.modifier = (target, stage, player) => stage[key] || 0
      }
      else if (isObj && 'relative_to_self' in arg) {
        const key = arg.relative_to_self
        this.modifier = (target, stage, player) => target[key] || 0
      }
      else if (isObj && 'relative_to_player' in arg) {
        const key = arg.relative_to_player
        this.modifier = (target, stage, player) => player[key] || 0
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
      else if (arg.cycle) { 
        this.cycle = arg.cycle || 0
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

  update = (target, stage, player) => {
    const ts = ((Date.now() - BaseSineExpression.start) + this.offset) * this.scale
    let modifier = this.modifier(target, stage, player)

    // inverses so the value so it's the reverse of
    // the modifier value
    if (this.inverse) {
      modifier = this.inverse - modifier;
    }

    const sine = (this.calc(ts) + (this.cycle * Math.PI * 2)) * modifier
    let percent = ((sine + 1) / 2)
		let value = (((percent * (this.max - this.min)) + this.min)) * this.flip

    if (this.useExact) {
      value = value <= 0.5 ? this.min : this.max;
    }

    if (this.roundNumber) {
      value = Math.round(value)
    }

    // if needed
    if (this.sortLayers && target.parent && this.priorValue !== value) {
      this.priorValue = value;
      target.parent.sortChildren();
    }
    
		this.mapping(target, (this.convertToInt ? 0 | value : value))
  }

}

export class CosineExpression extends BaseSineExpression {
	calc = Math.cos
}

export class SineExpression extends BaseSineExpression {
	calc = Math.sin
}