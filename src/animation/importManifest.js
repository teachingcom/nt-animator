export default async function importManifest ({ manifest, version, path, baseUrl, timeout }) {
  try {
    // get the manifest sub path and then
    // the resource key (which is the last value)
    const parts = path.split(/\//g)
    const key = parts.pop()

    // find the location to import data onto
    let target = manifest
    for (const part of parts) {
      target = target[part] = target[part] || { }
    }

    let data
    let attempts = 3
    const url = `${baseUrl}/${path}.json?${version}`.replace(/([^:]\/)\/+/g, '$1')
    while (attempts > 0) {
      try {
        data = await attemptFetch(url, timeout)
        break

      // if failed and still has attempts, request again
      } catch (ex) {
        if (--attempts > 0) {
          continue
        }

        // no more attempts
        console.error(`failed to import ${path}`)
        throw ex
      }
    }

    // save the result
    target[key] = data

    // return it, in case it's needed
    return data

  // had an issue loading this resource
  } catch (ex) {
    console.error('Failed to load', path)
    throw ex
  }
}

// performs an attempt to import data
async function attemptFetch (url, timeout) {
  // check if needing a timeout
  let controller
  let pendingTimeout
  if (timeout > 0) {
    controller = new AbortController()
    pendingTimeout = setTimeout(() => controller.abort(), timeout)
  }

  // request the data - make sure there are no
  // accidential double slashes
  const response = await fetch(url, { signal: controller?.signal })

  // cancel the timeout, if any
  clearTimeout(pendingTimeout)
  return await response.json()
}
