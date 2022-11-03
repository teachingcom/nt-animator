
/** walks through a PIXI tree */
export default function walk(container, action) {
	
	// iterate children first -- do this backwards
	// so removing anything won't mess up the array
	const children = (container.children || [ ]);
	for (let i = children.length;i-- > 0;) {
		walk(children[i], action)
	}
	
	// finally, process the actual object
	action(container)
}