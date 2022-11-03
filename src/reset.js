import { disposeAllThrottledUpdaters } from "./pixi/utils/throttled-updater";

// used to reset the animation engine (used when doing a reload
// that doesn't refresh the page)
export default function reset() {
	disposeAllThrottledUpdaters();
}