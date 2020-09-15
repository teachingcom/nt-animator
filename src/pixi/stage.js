
import { PIXI } from '../pixi/lib';

import ResponsiveContainer from "./responsive";
import { findResponsiveStage } from "./utils";

/** @typedef ResponsiveStageOptions
 * @property {number} [height] Uses the provided height as the default scaling value for the stage
 * @property {number} [width] Uses the provided width as the default scaling value for the stage
*/

/** creates a responsive stage for child elements to use */
export default class ResponsiveStage extends PIXI.Container {

	/** Creates a responsive stage that bases container sizes on a default size
	 * @param {ResponsiveStageOptions} options Options for creating a responsive stage
	 */
	constructor(options, ...args) {
		super(...args);
		this.options = options;
	}

	/** the defined width for this stage */
	get width() {
		return this._definedWidth;
	}

	/** the defined size for this stage */
	get height() {
		return this._definedHeight;
	}

	// defined scaling of the container
	_definedWidth = 0;
	_definedHeight = 0;

	/** returns that this is a stage that acts as a defined stage for responsive PIXI containers */
	isResponsiveStage = true;

	/** resizes the stage */
	resize(width, height) {
		const { options } = this;

		// track when last updated
		this.lastUpdate = +new Date;
		
		// update scaling values
		this._definedWidth = width;
		this._definedHeight = height;
		this.scaleX = width / options.width;
		this.scaleY = height / options.height;

		// if either value wasn't provided, replace it
		// with the other value or 1
		if (!('height' in options))
			this.scaleY = this.scaleX || 1;
		
		if (!('width' in options))
			this.scaleX = this.scaleY || 1;

	}

	/** finds a responsive stage for a responsive container
	 * @type {ResponsiveContainer}
	 * @returns {ResponsiveStage | null} The stage, if any
	 */
	static findResponsiveStage(container) {
		return findResponsiveStage(container);
	}

}