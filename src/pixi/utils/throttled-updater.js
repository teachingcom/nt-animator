
// shared animation loop
const throttled = { 
	frame: 0,
	elapsed: +new Date,
	updates: [ ],
};

// update all throttled animations
function updateAll() {
	requestAnimationFrame(updateAll);
	throttled.frame++;
	
	// update the timing
	const now = +new Date;
	const delta = now - throttled.elapsed;
	throttled.elapsed = now;

	// update each
	for (let i = throttled.updates.length; i-- > 0;) {
		try { throttled.updates[i](throttled.frame, delta) }
		catch (ex) { }
	}
}

// kick off update loop
updateAll();

// begin the updated
export default function createThrottledUpdater(frequency, scale, action) {
	
	// optional scaling parameter
	if (isNaN(scale)) {
		action = scale;
		scale = 1;
	}

	// update on the appropriate frames
	const update = (frame, delta) => {
		if (frame % frequency !== 0) return;
		action(delta * scale);
	};

	// add to the update queue
	throttled.updates.push(update);
	
	// return a stopper
	return () => {
		const index = throttled.updates.indexOf(update);
		throttled.updates.splice(index, 1);
	};

}