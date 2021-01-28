
// resources that are currently loading
const pending = { }
const images = { }

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

    // check if already existing
    if (url in images) {
      return resolve(images[url])
    }

    // if already waiting for a resource
    if (pending[url]) {
      pending[url].push({ resolve, reject })
      return
    }

    // reserve the image
    let img

    // limit attempts to reload
    let attempts = 3

    // if no active queue is available, start it now
    pending[url] = [{ resolve, reject }]

    // attempts to load an image
    const request = () => {
      img = new Image()
      img.onload = handle(true)
      img.onerror = handle(false)
      img.crossOrigin = 'anonymous'

      // replace the image url
      setTimeout(() => (img.src = `${url}${version ? `?${version}` : ''}`))
    }

    // create resolution actions
    const handle = success =>
      () => {
        // if wasn't successful, but is allowed to try again
        if (!success && --attempts > 0) {
          return request()
        }

        // all finished, resolve the result
        images[url] = success ? img : null

        // execute all waiting requests
        try {
          for (const handler of pending[url]) {
            const { resolve } = handler
            resolve(success ? img : null)
          }
        } finally {
          delete pending[url]
        }
      }

    // kick off the first attempt
    request()
  })
}
