import { PIXI } from '../pixi/lib';

export default class DetatchedContainer extends PIXI.Container {

	// a collection of all parts
	_parts = [ ]

	/** adds a child to the detatched container */
	addChild(...args) {

		// add to the list of parts
		for (const child of args) {
			this._parts.push(child);
		}
	}

	/** removes a child from a detatched container */
	removeChild(...args) {
		console.warn(`Removing children from DetatchedContainer is not implemented yet`);
		super.removeChild(...arg);
	}

	/** applies a value to each part */
	assign(apply) {
		this.each(part => Object.assign(part, apply));
	}

	/** applies a value to each part */
	each(action) {
		for (const part of this.parts)
			action(part);
	}

	/** attaches each child layer to the target container */
	attachTo(target, scaleTo) {
		const { parts } = this;

		// get a scale to work with
		if (isNaN(scaleTo)) {
			scaleTo = target.scale.x;
		}

		// trails are attached as detatched
		for (let i = parts.length; i-- > 0;) {
			const child = parts[i];

			// match the scale of the target
			child.scale.x = child.scale.y = scaleTo;
			child.x *= scaleTo;
			child.y *= scaleTo;

			// then add to the view
			target.addChild(child);
		}

		// always update sorting
		target.sortChildren();
	}
	
}