import { isObject } from '../../utils'
import * as mappings from '../mappings'

export default class SourceExpression {

	getWidthOfCar(stage, player) {
		window.PLAYER = player

		// return 344
		return player.car?.positions?.back / -0.7
		// return player.car?.width || 0

		if (!this.frontPosition) {
			return 0
			// const positions = player.car?.positions

			// if (!positions) {
			// 	return 0
			// }



			// const [ front ] = findDisplayObjectsOfRole(player.car, 'front')
			// console.log('target to', front)


			// if (front) {
			// 	this.frontPosition = front.x
			// }
			// else {
			// 	this.frontPosition = positions.back + player.car.bounds.width
			// }

			// console.log('will use', this.frontPosition, positions)

			// // not ready to use yet
			// if (!(boundedWidth && scaledWidth)) {
			// 	return 0
			// }

			// const scaleBy = boundedWidth / scaledWidth
			// this.frontPosition = ((boundedWidth / 2) * scaleBy) || 0
		}


		// console.log('resulting', result)
		return this.frontPosition
	}

	getValue() {
		return 0
	}

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)

		this.source = args.shift()
		this.nudge = (0 | args.shift()) || 0

		// handle look up helpers

		if (this.source === 'width_of_car') {
			this.getValue = this.getWidthOfCar
		}
		else {
			console.log('src unknown:', this.source)
		}

		// let values = []
		// let interval = 1000

    // for (const arg of args) { 
    //   const isObj = isObject(arg)
    //   if (arg === 'int') {
    //     this.convertToInt = true
    //   }
    //   else if (isObj && 'interval' in arg) {
    //     interval = arg.interval
    //   }
    //   else if (isObj && 'values' in arg) {
    //     values = arg.values
    //   }
    //   else if (arg === 'stagger' || (isObj && arg.stagger)) { 
    //     this.offset += 0 | (arg.stagger || 10000) * Math.random()
    //   }
    //   else if (arg.offset) { 
    //     this.offset = arg.offset * 1000
    //   }
    // }
    
    // // save the args
    // this.interval = interval
    // this.values = values
		// this.valueCount = this.values.length;
  }

  update = (target, stage, player) => {
		// const now = Date.now();
		// const index = (((now + this.offset) - CycleExpression.start) / this.interval) % this.valueCount;
		// const value = this.values[0 | index];

		const value = ((this.getValue?.(stage, player) || 0) + (this.nudge || 0)) || 0
		this.mapping(target, (this.convertToInt ? 0 | value : value))
  }

}
