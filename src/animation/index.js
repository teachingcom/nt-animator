import { EventEmitter } from "../common/event-emitter";
import { parsePath, resolvePath } from "./path";
import createInstance from "./generators";

/** handles creating PIXI animations using defined files */
export class Animator extends EventEmitter {

	/** creates a new instance */
	constructor(data, options) {
		super();

		// save the data file
		this.data = data;
		this.options = options;
	}

	/** the preferred prefix for loading external urls */
	get baseUrl() {
		return this.options.baseUrl || '/';
	}

	/** handles creating a new instance from a path
	 * @type {string} path The resource name to create
	 */
	create = async (resource) => {
		
		// start by finding the resource
		const path = parsePath(resource);
		const data = resolvePath(this.data, path.parts);

		// doesn't seem to exist
		if (!data) {
			console.error(`Cannot resolve node ${resource}`);
			return;
		}

		// has composition data
		if (data.compose !== undefined) {
			const instance = await createInstance(this, resource, data);
			instance.type = data.type;
			instance.path = resource;
			return instance;
		}

		// nothing to compose
		else {
			console.error('nothing to compse at', resource);
		}

	}

}
