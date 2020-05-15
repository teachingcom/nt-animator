// import * as PIXI from 'pixi.js';

// export default class DetatchedContainer extends PIXI.Container {

// 	set x(value) {
// 		const deltaX = this._x - value;
// 		this._x = value;
		
// 		const { parts } = this;
		
// 		// adjust each part by the delta
// 		for (const part of this._parts) {
// 			part[0].x += deltaX;
// 		}
// 	}

// 	get x() {
// 		return this._x;
// 	}

// 	addChild(child) {
// 		super.addChild(child);
// 		this._parts.push(child);
// 	}

// }