
/** creates a rendering surface */
export function createContext() {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	function reset() {
		canvas.width = canvas.width;
	}

	function resize(width, height) {
		canvas.width = width;
		canvas.height = height;
	}
	
	return {
		canvas,
		ctx,
		reset,
		resize
	};
}