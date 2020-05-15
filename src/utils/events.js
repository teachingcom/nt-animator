
/** waits for an event to happen */
export async function waitForEvent(obj, onEvent, onError, timeout) {
	return new Promise((resolve, reject) => {

		// create a timeout, if needed
		const wait = timeout || onError;
		const limit = isNumber(wait) && setTimeout(reject, wait);

		// clear the timeout when resolved
		const handle = (action) => (...args) => {
			clearTimeout(limit);
			action(...args);
		};

		// add each listener
		obj.addEventListener(onEvent, handle(resolve));
		if (onError) {
			obj.addEventListener(onError, handle(reject));
		}
	});
}