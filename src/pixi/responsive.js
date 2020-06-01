import * as PIXI from 'pixi.js';
import ResponsiveStage from "./stage";

/** Handles responsive scaling for a container relative to a stage */
export default class ResponsiveContainer extends PIXI.Container {

	/** returns the relative position for a container 
	 * @returns {number} the relative position value
	*/
	get relativeX() {
		return this._relativeX;
	}

	/** changes the relative position for a container 
	 * @param {number} value The percenage value to use 0-1
	*/
	set relativeX(value) {
		this._relativeX = value;
	}

	/** returns the relative position for a container 
	 * @returns {number} the relative position value
	*/
	get relativeY() {
		return this._relativeY;
	}

	/** changes the relative position for a container 
	 * @param {number} value The percenage value to use 0-1
	*/
	set relativeY(value) {
		this._relativeY = value;
	}

	// internal position tracking
	_relativeX = 0;
	_relativeY = 0;

	// bonus scaling values
	scaleX = 0;
	scaleY = 0;

	/** match the scaling as required */
	render(...args) {
		// TODO -- optimise and check for a timestamp
		// timestamp changes with resizes

		const stage = ResponsiveStage.findResponsiveStage(this);
		const { width, height, scaleX, scaleY } = stage;
		const { x, y } = this.scale;

		// update values
		this.x = this._relativeX * width;
		this.y = this._relativeY * height;
		this.scale.x = ((x / Math.abs(x)) * scaleX) + this.scaleX;
		this.scale.y = ((y / Math.abs(y)) * scaleY) + this.scaleY;

		// perform the render
		super.render(...args);
	}

}
