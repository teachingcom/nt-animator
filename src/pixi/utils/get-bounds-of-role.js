import { findDisplayObjectsOfRole } from './find-objects-of-role';

/** handles finding the bounds of a specified role */
export function getBoundsForRole(container, role) {
	const roles = findDisplayObjectsOfRole(container, role);
	
	// collect all bounds
	const xs = [ ];
	const ys = [ ];
	for (const match of roles) {
		const bounds = match.getBounds();
		xs.push(bounds.x, bounds.x + bounds.width);
		ys.push(bounds.y, bounds.y + bounds.height);
	}
	
	// figure out the bounds
	const left = Math.min.apply(Math, xs) || 0;
	const top = Math.min.apply(Math, ys) || 0;
	const right = Math.max.apply(Math, xs) || 0;
	const bottom = Math.max.apply(Math, ys) || 0;
	const width = right - left;
	const height = bottom - top;
	
	// give back the final bounds
	return { top, left, right, bottom, width, height };
}


