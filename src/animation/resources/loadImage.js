import { createContext } from "../../utils/graphics";
import { shared as cache } from '../../utils/assetCache';

// resources that are currently loading
const pending = { };
const images = { };

/** handles loading an external image url 
 * @param {string} url The url of the image to load
*/
export default async function loadImage(url) {
	const now = +new Date;

	// check if already existing
	if (url in images)
		return images[url];

	// if already waiting for a resource
	if (pending[url])
		return new Promise((resolve, reject) => {
			pending[url].push({ resolve, reject });
		});

	// // check for a cached image
	// try {

	// 	const existing = await cache.getItem(url);
	// 	if (!!existing) {
	// 		const img = images[url] = document.createElement('img');
	// 		img.src = existing;
	// 		return img;
	// 	}
	// }
	// catch (ex) { }

	// no pending request
	return new Promise((resolve, reject) => {
		const img = document.createElement('img');

		// if no active queue is available, start it now
		pending[url] = [{resolve, reject}];

		// create resolution actions
		const handle = success =>
			() => {
				
				// all finished, resolve the result
				images[url] = success ? img : null;

				// // try and cache
				// if (success)
				// 	requestAnimationFrame(() => {
				// 		try {

				// 			// save to the cache
				// 			const context = createContext();
				// 			context.resize(img.width, img.height);

				// 			// create a data url for the image
				// 			context.ctx.drawImage(img, 0, 0);
				// 			const data = context.canvas.toDataURL();
				// 			cache.setItem(url, data);
				// 		}
				// 		// do not fail for this
				// 		catch(ex) { }
				// 	});

				// execute all waiting requests
				try {
					for (const handler of pending[url]) {
						const { resolve } = handler;
						resolve(success ? img : null);
					}
				}
				// cleanup
				finally {
					delete pending[url];
				}
			};


		// make the exernal image request
		img.onload = handle(true);
		img.onerror = handle(false);
		img.src = url;
	});
}