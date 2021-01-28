export default async function importManifest ({ manifest, path, baseUrl, timeout }) {
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

    // if this has already been attached
    if (target[key]) {
      return
    }

    // check if needing a timeout
    let controller
    let pendingTimeout
    if (timeout > 0) {
      controller = new AbortController()
      pendingTimeout = setTimeout(() => controller.abort(), timeout)
    }

    // request the data - make sure there are no
    // accidential double slashes
    const url = `${baseUrl}/${path}.json`.replace(/([^:]\/)\/+/g, '$1')
    const response = await fetch(url, { signal: controller?.signal })

    // cancel the timeout, if any
    clearTimeout(pendingTimeout)

    // save the result
    const data = await response.json()
    target[key] = data

    // return it, in case it's needed
    return data

  // had an issue loading this resource
  } catch (ex) {
    console.error('Failed to load', path)
    throw ex
  }
}
