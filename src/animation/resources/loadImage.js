import { createContext } from "../../utils/graphics";

// resources that are currently loading
const pending = { };
const images = { };

// expire a day later
const EXPIRE_MS = 24 * 60 * 60 * 1000;

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

	// check for a locally stored version
	try {
		const existing = JSON.parse(localStorage.getItem(url));
		if (existing && existing.expires > now) {
			const img = document.createElement('img');
			images[url] = img;
			img.src = existing.src;
			return img;
		}
	}
	// do not fail if this doesn't work
	catch (ex) { }

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

				// try and cache
				if (success)
					requestAnimationFrame(() => {
						try {
							const context = createContext();
							context.resize(img.width, img.height);

							// create a data url for the image
							context.ctx.drawImage(img, 0, 0);
							const data = context.canvas.toDataURL();
							const cached = JSON.stringify({ src: data, expires: now + EXPIRE_MS });
							localStorage.setItem(url, cached);
						}
						// do not fail for this
						catch(ex) { }
					});

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