import { toColor } from "../animation/converters";

/** creates a rendering surface */
export function createContext() {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	function reset() {
		canvas.width = canvas.width;
	}

	function resize(width, height) {
		canvas.width = width;
		canvas.height = height;
	}

	ctx.drawTexture = drawPixiTexture;
	
	return {
		canvas,
		ctx,
		reset,
		resize
	};
}

/** draws a texture */
export function drawPixiTexture(texture, x, y, width, height) {

	const { orig, baseTexture } = texture;
	const { source } = baseTexture.resource;

	// console.log(source);
	this.drawImage(source, orig.x, orig.y, orig.width, orig.height, x, y, width, height);
}


/** generates a placeholder image */
export function createPlaceholderImage({
	width = 100,
	height = 100,
	canvas = document.createElement('canvas'),
	ctx = canvas.getContext('2d'),
	background = 0x000000,
	color = 0xffffff
}) {

	// match size
	canvas.width = width;
	canvas.height = height;

	/** generates a placeholder image */
	ctx.lineWidth = 4;
	ctx.strokeStyle = `#${toColor(color)}`;
	ctx.fillStyle = `#${toColor(background)}`;
	
	// background
	ctx.globalAlpha = 0.5;
	ctx.fillRect(0, 0, width, height);
	
	// paint a temp sprite
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(width, 0);
	ctx.lineTo(width, height);
	ctx.lineTo(0, height);
	ctx.lineTo(0, 0);
	ctx.lineTo(width, height);
	ctx.moveTo(width, 0);
	ctx.lineTo(0, height);
	ctx.globalAlpha = 1;
	ctx.stroke();

	// give back the generated image
	return canvas;
}