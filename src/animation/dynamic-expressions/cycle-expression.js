import { isObject } from '../../utils'
import * as mappings from '../mappings'

export default class CycleExpression {

  static start = Date.now()

  offset = 0

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)
    this.modifier = () => 1
		
		let values = []
		let interval = 1000

    for (const arg of args) { 
      const isObj = isObject(arg)
      if (arg === 'int') {
        this.convertToInt = true
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
		this.valueCount = this.values.length;
  }

  update = (target, stage) => {
		const now = Date.now();
		const index = (((now + this.offset) - CycleExpression.start) / this.interval) % this.valueCount;
		const value = this.values[0 | index];

		this.mapping(target, (this.convertToInt ? 0 | value : value))
  }

}
