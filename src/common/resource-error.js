export default class LoadResourceError extends Error {
  constructor(path = "unknown", data) {
    super(`Failed to load resource "${path}"`);
    this.data = data
  }
}