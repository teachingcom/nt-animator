
// resources that are currently loading
const pending = { };
const images = { }

/** handles loading an external image url 
 * @param {string} url The url of the image to load
*/
export default async function loadImage(url) {

	// check if already existing
	if (url in images)
		return images[url];

	// if already waiting for a resource
	if (pending[url]) {
		return new Promise((resolve, reject) => {
			pending[url].push({ resolve, reject });
		});
	}

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