export default class Toggle {

	modes = { }

	// activates a toggle
	activate(mode) {
		const toggles = this.modes[mode]
		if (!toggles) {
			return
		}

		// activate the toggles
		for (const toggle of toggles) { 
			toggle()
		}
	}

	// adds a new toggle state
	add(state, obj, props) {

		// create the new collection
		if (!this.modes[state]) {
			this.modes[state] = [ ]
		}

		// TODO: this is a very simple version
		// of this assignment - this will need to
		// be updated to support more property
		// types. For now, this works with FPS
		// include the toggle state
		this.modes[state].push(() => {
			Object.assign(obj.config.props, props)
		})
	}

}