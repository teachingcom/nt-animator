import * as mappings from '../mappings'

export default class ModExpression {

  offset = 0
  scale = 1
  flip = 1

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)

    let modOf = 1
    for (const arg of args) { 
			if (arg === 'int') {
        this.convertToInt = true
      }
			else if (arg === 'invert') {
				this.flip = -1
			}
      else if ('of' in arg) {
        modOf = arg.of
      }
      else if (arg.scale) { 
        this.scale = arg.scale * 0.01
      }
      else if (arg.offset) { 
        this.offset = arg.offset * 1000
      }
    }
    
    // save the args
    this.modOf = modOf
  }

  update = (target, stage) => {
    const ts = (Date.now() + this.offset) * this.scale

		// calculate the current mod value
		const value = (ts % this.modOf) * this.flip

		// apply the value
		this.mapping(target, (this.convertToInt ? 0 | value : value))
  }

}
