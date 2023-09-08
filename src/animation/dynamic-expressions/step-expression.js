import * as mappings from '../mappings'

export default class StepExpression {

  offset = 0
  scale = 1
  flip = 1

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)

    let step = 1
    let target = 0
    let origin = 0
    for (const arg of args) { 
			if (arg === 'int') {
        this.convertToInt = true
      }
			else if (arg === 'invert') {
				this.flip = -1
			}
      else if ('to' in arg) {
        target = arg.to
      }
      else if ('from' in arg) {
        origin = arg.from
      }
      else if ('per' in arg) {
        step = arg.per
      }
      else if ('step' in arg) {
        step = arg.step
      }
      else if ('startAt' in arg) { 
        this.startAt = arg.startAt
        this.hasStartingValue = true
      }
    }
    
    // save the args
    this.step = step
    this.target = target
    this.origin = origin
    this.min = Math.min(this.target, this.origin)
    this.max = Math.max(this.target, this.origin)
    this.range = Math.abs(origin - target)
    this.ts = Date.now()
    this.hasInit = false
  }

  update = (target, stage) => {
    const now = Date.now()
    const previous = this.ts
    this.ts = now

    // for the first pass
    if (!this.hasInit) {
      this.hasInit = true
      this.currentValue = this.hasStartingValue ? this.startAt : this.origin 
      this.mapping(target, this.currentValue)
      return
    }

    // create deltas
    const delta = now - previous
    const scale = delta / DELTA_TARGET
    const value = this.step * scale

    // update and stay in range
    let result = this.currentValue + value
    if (result < this.min) {
      result += this.range
    }
    else if (result > this.max) {
      result -= this.range;
    }

    // save for the next pass
    // TODO: ideally we'd just pull this from the object itself, but
    // we'd have to redo the mapping file to include getters and setters (apply)
    // for now, just track it here
    this.currentValue = result

    // update the value
    this.mapping(target, (this.convertToInt ? 0 | result : result))
  }

}

const DELTA_TARGET = 1000 / 60
