import { isObject } from '../../utils'
import * as mappings from '../mappings'
import animate from '../../animate';

export default class TweenExpression {

  static start = Date.now()

  cycle = 0
  offset = 0
  scale = 1
  flip = 0

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)

		// this.modifier = () => 1
    // this.sortLayers = this.prop === 'z';

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
      else if (arg === 'yoyo') {
        this.yoyo = true
      }
      else if (arg === 'stagger') {
        this.stagger = true
      }
      else if (isObj && 'duration' in arg) {
        this.duration = arg.duration
      }
      else if (isObj && 'ms' in arg) {
        this.duration = arg.ms
      }
      else if (isObj && 'delay' in arg) {
        this.delay = arg.delay
      }
      else if (isObj && 'ease' in arg) {
        this.ease = arg.ease
      }
      else if (isObj && 'loop' in arg) {
        this.loop = arg.loop
      }
      else if (isObj && 'min' in arg) {
        min = arg.min
      }
      else if (isObj && 'max' in arg) {
        max = arg.max
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

		// default value
		this.value = this.flip ? this.max : this.min

		animate({
			from: { t: min },
			to: { t: max },
			flip: this.flip,
			yoyo: this.yoyo,
			duration: this.duration || 1000,
			delay: this.delay || 0,
			randomStart: this.stagger,
			ease: this.ease,
			delay: this.delay,
			loop: this.loop || false,
			autoplay: true,
			update: props => {
				this.value = props.t
			}
		})
  }

  update = (target, stage, player) => {   
		let { value } = this

    if (this.useExact) {
      value = value <= 0.5 ? this.min : this.max;
    }

    if (this.roundNumber) {
      value = Math.round(value)
    }
    
		this.mapping(target, (this.convertToInt ? 0 | value : value))
  }

}
