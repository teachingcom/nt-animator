
/** simple event emitter base class */
export class EventEmitter {

	// map of all events and names
	_events = { }

	// returns the event collection for a specific event
	_getEvents = (event, createIfMissing) => {
		let events = this._events[event];
		if (!events && createIfMissing) {
			events = this._events[event] = [];
		}

		return events;
	}

	/** emits an event to all listeners
	 * @param {string} event The name of the event to fire
	 * @param {...any} args arguments for the emit
	 */
	emit = (event, ...args) => {
		const events = this._getEvents(event, false);
		if (events) {
			const { length } = events;
			for (let i = 0; i < length; i++) {
				try {
					const handler = events[i];
					if (!handler) {
						console.warn(`Missing handler found for event ${event}`);
					}
					else handler(...args);
				}
				catch (ex) {
					console.error(ex);
				}
			}
		}
	}

	/** begins listening for an event 
	 * @param {string} event The name of the event to listen for
	 * @param {function} handler The handler for the event
	*/
	on = (event, listener) => {
		const events = this._getEvents(event, true);
		events.push(listener);
		
		// return a disposal method
		return () => this.off(event, listener);
	}

	/** stops listening to an event 
	 * @param {string} event The name of the event to listen for
	 * @param {function} handler The handler for the event
	*/
	off = (event, listener) => {
		const events = this._getEvents(event);
		if (events) {

			// only expects the listener once
			const removeAt = events.indexOf(listener);
			if (~removeAt) {
				events.splice(removeAt, 1);
				return true;
			}
		}

		// nothing to remove
		return false;
	}

	/** listens to an event only once
	 * @param {string} event The name of the event to listen for
	 * @param {function} handler The event handler
	 */
	once = (event, listener) =>{

		// replace the handler with one that removes itself
		const once = (...args) => {
			try { listener(...args); }
			finally { this.off(event, once); }
		}

		// listen normally
		this.on(event, once);
	};

}