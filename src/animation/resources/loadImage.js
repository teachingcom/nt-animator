const IMAGE_RESOURCE_TIMEOUT = 3000;

// resources that are currently loading
const pending = { };

/** handles loading an external image url 
 * @param {string} url The url of the image to load
*/
export default async function loadImage(url) {

	// if already waiting for a resource
	if (pending[url]) {
		return new Promise((resolve, reject) => {
			pending[url].push([ resolve, reject ]);
		});
	}

	// no pending request
	return new Promise((resolve, reject) => {

		// if no active queue is available, start it now
		pending[url] = [[resolve, reject]];

		// create resolution actions
		const timeout = setTimeout(reject, IMAGE_RESOURCE_TIMEOUT);
		const handle = action =>
			() => {
				
				// kick off each handler
				try {
					for (const handler of pending[url]) {
						handler[action](img);
					}
				}
				// cleanup
				finally {
					clearTimeout(timeout);
					delete pending[url];
				}
			};

		// make the exernal image request
		const img = document.createElement('img');
		img.onload = handle(0);
		img.onerror = handle(1);
		img.src = url;
	});
}