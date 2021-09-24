import { isObject } from '../../utils'
import * as mappings from '../mappings'

export default class SumExpression {

  static start = Date.now()

  offset = 0
  scale = 1
  flip = 1

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)
    this.modifier = () => 1
		
		let value = 0
		let per = 1

    for (const arg of args) { 
      const isObj = isObject(arg)
      if (arg === 'int') {
        this.convertToInt = true
      }
      else if (arg === 'invert') {
        this.flip = -1
      }
      else if (isObj && 'start' in arg) {
        value = arg.start
      }
      else if (isObj && 'per' in arg) {
        per = arg.per
      }
      else if (isObj && 'mod' in arg) {
        this.mod = arg.mod
      }
      else if (arg === 'stagger' || (isObj && arg.stagger)) { 
        this.offset += 0 | (arg.stagger || 10000) * Math.random()
      }
      else if (arg.offset) { 
        this.offset = arg.offset * 1000
      }
    }
    
    // save the args
    this.value = value + (this.offset || 0)
    this.per = per || 1
  }

  update = (target, stage) => {
		this.value += this.per
		const value = (this.mod ? (this.value % this.mod) : this.value) * this.flip
		this.mapping(target, (this.convertToInt ? 0 | value : value))
  }

}
