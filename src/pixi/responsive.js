import { PIXI } from '../pixi/lib';
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
	updateTransform(...args) {

		// check if the stage scale has changed
		const stage = ResponsiveStage.findResponsiveStage(this);
		if (stage.lastUpdate !== this._resizedTimestamp) {
			this._resizedTimestamp = stage.lastUpdate;
			
			// update the scaling
			const { scaleX, scaleY } = stage;
			const { x, y } = this.scale;

			// update values
			this.scale.x = ((x / Math.abs(x)) * scaleX) + this.scaleX;
			this.scale.y = ((y / Math.abs(y)) * scaleY) + this.scaleY;
		}
		
		// match their relative positions
		// const { width, height } = stage;
		this.x = this._relativeX * stage._definedWidth;
		this.y = this._relativeY * stage._definedHeight;

		// perform the render
		super.updateTransform(...args);
	}

}
