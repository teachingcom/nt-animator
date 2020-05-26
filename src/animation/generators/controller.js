import { isNumber } from "../../utils";

export default class Controller {

	/** registers a layer for the controller */
	register(obj) {

		// determine types
		if (obj.isEmitter)
			this.emitters.push(obj);
		else if (obj.isSprite)
			this.sprites.push(obj);
		else if (obj.isMask)
			this.masks.push(obj);
		else if (obj.isGroup)
			this.groups.push(obj);
		else if (obj.isRepeater)
			this.repeaters.push(obj);

		// track animations
		if (obj.hasAnimation)
			this.animations.push(obj.animation);
	}

	stopEmitters = () => {
		const { emitters } = this;
		for (const instance of emitters) {
			const { emitter } = instance;
			emitter.emit = false;
		}
	}

	activateEmitters = () => {
		const { emitters } = this;
		for (const instance of emitters) {
			const { emitter } = instance;
			const { config } = emitter;
			emitter.autoUpdate = true;
			emitter.lifetime = isNumber(config.duration) ? config.duration / 1000 : undefined;
			emitter.emit = true;
		}
	}

	// list of all nested layers
	emitters = [ ]
	animations = [ ]
	sprites = [ ]
	masks = [ ]
	groups = [ ]
	repeaters = [ ]

}