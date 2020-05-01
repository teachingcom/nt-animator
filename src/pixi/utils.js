
// This function is generated to be flat as opposed to using
// a loop since it's performed each frame of animation by
// many children

// generates a function simiar to
// function findResponsiveState(container) {
//   if (!container.parent) return;
//   if (container.parent.isResponsiveState) return container.parent;
//   if (!container.parent.parent) return;
//   if (container.parent.parent.isResponsiveState) return container.parent.parent;
// ... and so on

/** Searches PIXI ancestors looking for a ResponsiveStage */
export const findResponsiveStage = (() => {
	const MAXIMUM_LOOKUPS = 10;
	const code = [ ];

	// create a check for the maximum number of lookups to perform
	for (let i = 1; i < MAXIMUM_LOOKUPS; i++) {
		
		// string together a series of .parent checks
		const refs = [ ];
		for (let j = 0; j < i; j++) refs.push('parent');
		const ref = refs.join('.');

		// create the condition to check for a parent
		// and check if it's a ResponsiveStage
		code.push(`
			if (!container.${ref}) return;
			if (container.${ref}.isResponsiveStage) return container.${ref}
		`);
	}

	/** pre-compiled parent lookup */
	return new Function('container', code.join(';'));
})();