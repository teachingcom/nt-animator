import { isArray, isString } from "../../utils";
import { createUrlFromRef, parsePath } from "../path";
import { unpack } from "../utils";
import getSprite from "./getSprite";
import loadImage from "./loadImage";
import { evaluateExpression } from "../expressions";

/** loads all images for a layer */
export default async function resolveImages(animator, path, composition, layer) {
	const config = await animator.lookup(path);
	
	// check for a based on path
	let relativeTo;
	if (config.basedOn) {
		const parsed = parsePath(config.basedOn);
		if (parsed.isAbsolute)
			relativeTo = parsed.parts.join('/');
	}

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

	// check for any shorthand to fill longer complex animations
	// when assigning images you can use the syntax of
	// [5, t] to append [t,t,t,t,t]
	// [3, t, u] to append [t,u,t,u,t,u]
	let expanded = [ ];
	for (let item of images) {
		// just a string
		if (isString(item)) {
			expanded.push(item);
		}
		// special syntax
		else if (isArray(item)) {
			const append = item.slice(1);
			for (let i = 0; i < item[0]; i++) {
				expanded = expanded.concat(append);
			}
		}
	}

	// replace the images
	images = expanded;

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
			spritesheetId = relativeTo || path;
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
