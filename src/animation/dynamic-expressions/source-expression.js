import { isObject } from '../../utils'
import * as mappings from '../mappings'

export default class SourceExpression {

	getValue() {
		return 0
	}

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)

		this.source = args.shift()
		this.nudge = (0 | args.shift()) || 0

		// // handle look up helpers
		// if (this.source === 'width_of_car') {
		// 	this.getValue = this.getWidthOfCar
		// }
		// else {
		// 	console.log('src unknown:', this.source)
		// }
  }

  update = (target, stage, player) => {
		const value = ((this.getValue?.(stage, player) || 0) + (this.nudge || 0)) || 0
		this.mapping(target, (this.convertToInt ? 0 | value : value))
  }

}
