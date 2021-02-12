import * as mappings from '../mappings'

class BaseSineExpression {

  offset = 0
  scale = 1

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)

    let min = 0
    let max = 1
    for (const arg of args) { 
      if (arg.min) {
        min = arg.min
      }
      else if (arg.max) {
        max = arg.max
      }
      else if (arg.scale) { 
        this.scale = arg.scale * 0.01
      }
      else if (arg.offset) { 
        this.offset = arg.offset * 1000
      }
      else if (arg === 'int') {
        this.convertToInt = true
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
    
    // extra conversions
    this.convertBy = prop === 'rotation' ? (Math.PI * 2) : 1
  }

  update = (target, stage) => {
    const ts = (Date.now() + this.offset) * this.scale
    const percent = ((this.calc(ts) + 1) / 2)
		const value = (percent * (this.max - this.min)) + this.min
		this.mapping(target, (this.convertToInt ? 0 | value : value))
  }

}

export class CosineExpression extends BaseSineExpression {
	calc = Math.cos
}

export class SineExpression extends BaseSineExpression {
	calc = Math.sin
}