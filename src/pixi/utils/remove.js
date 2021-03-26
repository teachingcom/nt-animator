
/** helper function to remove all child objects */
export function removeDisplayObject(obj) {
	const children = obj.children || [ ];

	// remove backwards
	for (let i = children.length; i-- > 0;) {
		const child = children[i];

		// dispose children first, if any
		if (child.children?.length > 0)
			removeDisplayObject(child);
	}

	// cleanup, if possible
	if (obj.controller) {
		obj.controller.dispose();
	}

	// remove itself, if possible
	if (obj.parent) {
		const index = obj.parent.getChildIndex(obj);
		if (!!~index) obj.parent.removeChildAt(index);
	}
}
