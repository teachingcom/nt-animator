import * as mappings from '../mappings'
import BezierAproximator from './bezier-aproximator'

export default class BezierExpression {

	static start = Date.now()

  offset = 0
  scale = 1
  flip = 1
	startAt = 0
	endAt = 0

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)

		// first 4 arguments should always be the curve
		let a = parseFloat(args.shift());
		let b = parseFloat(args.shift());
		let c = parseFloat(args.shift());
		let d = parseFloat(args.shift());

		// validate
		if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) {
			console.warn('invalid bezier expression', a, b, c, d);
			a = b = 0;
			c = d = 0;
		}

		// get remaining args
    for (const arg of args) {
			if (arg === 'int') {
        this.convertToInt = true
      }
			else if ('min' in arg) {
        this.min = parseFloat(arg.min)
      }
			else if ('max' in arg) {
        this.max = parseFloat(arg.max)
      }
			else if (arg === 'invert') {
				this.flip = -1
			}
      else if (arg.scale) { 
        this.scale = arg.scale * 0.005
      }
      else if (arg.offset) { 
        this.offset = arg.offset * 1000
      }
    }
    
    // save the args
    this.bezier = BezierAproximator.create(a, b, c, d, true)
		this.range = this.max - this.min
  }

  update = (target, stage) => {
    const ts = ((Date.now() - BezierExpression.start) + this.offset) * this.scale
		const scale = this.bezier.calc(ts)
		const value = this.min + (this.range * scale)

		// apply the value
		this.mapping(target, (this.convertToInt ? 0 | value : value))
  }

}
