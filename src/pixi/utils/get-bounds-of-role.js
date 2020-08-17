import { findDisplayObjectsOfRole } from './find-objects-of-role';

/** handles finding the bounds of a specified role */
export function getBoundsForRole(container, role, useGlobal = false) {

	// cache the selection of layers - layers shouldn't
	// change roles, so this can avoid the recursive
	// search each time
	if (!container._roles || !container._roles[role]) {
		container._roles = container._roles || { };
		const roles = findDisplayObjectsOfRole(container, role);
		container._roles[role] = roles;
	}

	// grab the cached layers for the role
	const roles = container._roles[role];
	
	// collect all bounds
	const xs = [ ];
	const ys = [ ];
	for (const match of roles) {

		// get the bounding box
		let bounds = useGlobal ? match.getBounds(false) : match.getLocalBounds(false);
		
		// if not using global, still convert the points to be
		// relative to the screen
		if (!useGlobal) {
			const tl = match.toGlobal({ x: bounds.left, y: bounds.top });
			const br = match.toGlobal({ x: bounds.right, y: bounds.bottom });
			bounds = { 
				left: tl.x,
				top: tl.y,
				right: br.x,
				bottom: br.y,
				width: br.x - tl.x,
				height: br.y - tl.y,
			};
		}
		
		// save the points
		xs.push(bounds.left, bounds.right);
		ys.push(bounds.top, bounds.bottom);
	}

	// make sure there's at least one coordinate
	if (!xs.length) return null;
	
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


