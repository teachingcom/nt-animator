import { isObject } from '../../utils'
import * as mappings from '../mappings'

export default class BetweenExpression {

  offset = 0
  scale = 1
  flip = false
	min = 0
	max = 0

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)

    for (const arg of args) { 
			const isObj = isObject(arg);
			if (arg === 'int') {
        this.convertToInt = true
      }
			else if (arg === 'invert' || arg === 'flip') {
				this.flip = true;
			}
      else if ('min' in arg) {
        this.min = arg.min
      }
      else if ('max' in arg) {
        this.max = arg.max
      }
      else if (arg.scale) { 
        this.scale = arg.scale
      }
      // else if (arg.offset) { 
      //   this.offset = arg.offset * 1000
      // }
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
    }

  }

  update = (target, stage, player) => {

		// calculate the current mod value
		const mod = this.modifier?.(target, stage, player) || 0
    const range = this.max - this.min
		let value = (range * mod) + this.min // this.min + (this.max * mod)

		// inverting
		if (this.flip) {
			// value = this.max - value
			value = range - value
		}

		value *= this.scale

		// apply the value
		this.mapping(target, (this.convertToInt ? 0 | value : value))
  }

}
