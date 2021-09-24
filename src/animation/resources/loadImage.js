
/** handles loading an external image url
 * @param {string} url The url of the image to load
*/
export default function loadImage (url, version) {
  return new Promise((resolve, reject) => {
    // prevent accidental double slashes
    const parts = url.split('://')
    const last = parts.length - 1
    parts[last] = parts[last].replace(/\/+/g, '/')
    url = parts.join('://')

    // reserve the image
    let img

    // limit attempts to reload
    let attempts = 3

    // tracking image loading
    let checkIfLoaded;

    // get the image to load
    const src = `${url}${version ? `?${version}` : ''}`

    // attempts to load an image
    const request = () => {
      const success = handle(true)
      const fail = handle(false)
      
      // create the image
      img = new Image()
      img.onload = success
      img.onerror = fail
      img.crossOrigin = 'anonymous'

      // backup solution for if an image loads
      // but never has a chance to report that
      // it was successful
      checkIfLoaded = setInterval(() => {
        if (img.complete && img.naturalHeight !== 0) {
          success()
        }
      }, 200)

      // replace the image url
      setTimeout(() => {
        img.src = src
      }, 10)
    }

    // create resolution actions
    const handle = success =>
      () => {
        // if wasn't successful, but is allowed to try again
        if (!success && --attempts > 0) {
          return request()
        }

        // // all finished, resolve the result
        // images[url] = success ? img : null

        // clear extra checks
        clearInterval(checkIfLoaded)

        // finished
        resolve(success ? img : null)

        // // execute all waiting requests
        // try {
        //   for (const handler of pending[url]) {
        //     const { resolve } = handler
        //     resolve(success ? img : null)
        //   }
        // } finally {
        //   delete pending[url]
        // }
      }

    // kick off the first attempt
    request()
  })
}
