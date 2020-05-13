
// defines generator spawn points
export default function defineEmitterBounds(config, params) {
	
	// is a circle
	if (!!params.circle)
		defineCircleBounds(config, params.circle);
	
	// is a circle
	else if (!!params.ring)
		defineRingBounds(config, params.ring);
	
	// // is a arc
	// else if (!!params.arc)
	// 	defineArcBounds(config, params.arc);
	
	// // is a burst
	// else if (!!params.burst)
	// 	defineBurstBounds(config, params.burst);
	
	// is a rectangle
	else if (!!params.rect || !!params.rectangle || !!params.box)
		defineRectangleBounds(config, params.rect || params.rectangle || params.box);
	
}

// standard warning
function warn(type) {
	console.warn(`Invalid ${type} emitter bounds defined`);
}


// create circular bounding area for an emitter
function defineCircleBounds(config, circle) {
	let x, y, r;

	// radius, x, and y
	if (circle.length === 3) {
		x = circle[0];
		y = circle[1];
		r = circle[2];
	}
	// radius and x
	else if (circle.length === 2) {
		r = circle[0];
		x = circle[1];
		y = 0;
	}
	// radius only
	else if (circle.length === 1) {
		r = circle[0];
		x = 0;
		y = 0;
	}
	// radius only (numeric form)
	else if (isNumber(circle)) {
		x = 0;
		y = 0;
		r = circle;
	}
	// no matches
	else {
		warn('circular');
		return;
	}

	// update the spawn type
	config.spawnType = 'circle';
	config.spawnCircle = { x, y, r };
}


// create circular bounding area for an emitter
function defineRingBounds(config, ring) {
	let x, y, r, minR;

	// radius, x, y, min-radius
	if (ring.length === 4) {
		r = ring[0];
		x = ring[1];
		y = ring[2];
		minR = ring[3];
	}
	// radius, x, and y
	else if (ring.length === 3) {
		r = ring[0];
		x = ring[1];
		y = ring[2];
		minR = r - 1;
	}
	// radius and x
	else if (ring.length === 2) {
		r = ring[0];
		x = ring[1];
		y = 0;
		minR = r - 1;
	}
	// radius only
	else if (ring.length === 1) {
		r = ring[0];
		x = 0;
		y = 0;
		minR = r - 1;
	}
	// radius only (numeric form)
	else if (isNumber(ring)) {
		x = 0;
		y = 0;
		r = ring;
		minR = r - 1;
	}
	// no matches
	else {
		warn('ring');
		return;
	}

	// update the spawn type
	config.spawnType = 'ring';
	config.spawnCircle = { x, y, r, minR };
}


// creates a rectangular point
// last param is optional, otherwise creates a box
function defineRectangleBounds(config, rect) {
	let x, y, w, h;
	
	// width, height, x, and y
	if (rect.length === 4) {
		w = rect[0];
		h = rect[1];
		x = rect[2];
		y = rect[3];
	}
	// width, height, and x
	else if (rect.length === 3) {
		w = rect[0];
		h = rect[1];
		x = rect[2];
		y = 0;
	}
	// width, height
	else if (rect.length === 2) {
		w = rect[0];
		h = rect[1];
		x = 0;
		y = 0;
	}
	// width (box shape -- height is assumed to match)
	else if (rect.length === 1) {
		w = h = rect[0];
		x = 0;
		y = 0;
	}
	// width (box shape -- height is assumed to match)
	else  if (isNumber(rect)) {
		x = 0;
		y = 0;
		w = h = rect;
	}
	// no matches
	else {
		warn('rectangular');
		return;
	}

	// create the rect
	config.spawnType = 'rect';
	config.spawnRect = {
		w, h,
		x: x - (w / 2),
		y: y - (h / 2),
	};
}
