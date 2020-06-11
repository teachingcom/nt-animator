import { isArray, isString } from "../../utils";
import { createUrlFromRef, parsePath } from "../path";
import { unpack } from "../utils";
import getSprite from "./getSprite";
import loadImage from "./loadImage";
import { evaluateExpression } from "../expressions";

/** loads all images for a layer */
export default async function resolveImages(animator, path, composition, layer) {

	// normalize images as a single array
	let images = [ ];
	for (let source of [layer.image, layer.images]) {

		// eval, if needed
		source = evaluateExpression(source);

		// update
		if (isString(source))
			images.push(source);
		else if (isArray(source))
			images = images.concat(source);
	}

	// unpack all image reference
	delete layer.image;
	layer.images = images;
	unpack(animator, composition, layer, 'images');

	// with each image, handle loading the correct resource
	const pending = [ ];
	for (const item of images) {
		let imageId;
		let spritesheetId;

		// read the path
		const ref = parsePath(item);

		// handle loading exernal image urls
		if (ref.isUrl) {
			const url = createUrlFromRef(ref);
			const promise = loadImage(url);
			pending.push(promise);
			continue;
		}

		// check for an image relative to the current resource
		if (ref.isLocal) {
			imageId = item;
			spritesheetId = path;
		}
		// check for an image shared through the project
		else if (ref.isAbsolute) {
			spritesheetId = ref.parts.shift();
			imageId = ref.parts.join('/');
		}

		// load the spritesheet, if required
		const promise = getSprite(animator, spritesheetId, imageId);
		pending.push(promise);
	}

	// send back all loaded images?
	return await Promise.all(pending);
}
