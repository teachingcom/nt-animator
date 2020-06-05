
/** finds all PIXI layers matching a specified role */
export function findDisplayObjectsOfRole(container, role, depth = 0, results = [ ]) {
	
	// check each child, if any
	for (const child of container.children || [ ]) {

		// if this matches the role, add it to the results
		if (!!child.role && !!~child.role.indexOf(role)) {
			results.push(child);
		}

		// if there's children, check the container
		findDisplayObjectsOfRole(child, role, depth + 1, results);
	}
	
	// if it's not the top level, just continue
	if (depth !== 0) return;
	
	// give back the matches
	return results;
}