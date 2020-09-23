import anime from 'animejs/lib/anime.es.js'
import { isArray, isNumber } from '../utils';

/** handles creating a tween animator */
export default function animate(params) {

	// create the animation
	const props = { };
	const config = {
		targets: props,
		easing: params.ease || params.easing || params.easings || 'linear',
		duration: params.duration,
		delay: params.delay || 0,
		autoplay: params.auto !== false && params.autoplay !== false,
		loop: params.loop !== false
	};

	// update callback
	if (params.update)
		config.update = () => params.update(props);

	// completion callback
	if (params.complete)
		config.complete = params.complete;

	// check for a from/to animation
	if (params.from && params.to) {
		Object.assign(props, params.from);
		config.keyframes = [ params.to ];
	}
	// check for keyframes
	else if (params.values) {

		// create the mapping
		const [ inital, ...remaining ] = params.values;
		Object.assign(props, inital);
		config.keyframes = remaining;

		// check for progress markers
		for (let i = 0; i < remaining.length; i++) {
			const step = remaining[i];
			if (isNumber(step.at))
				remaining.duration = 0 | (step.at * duration);
		}

		// if unique timings
		if (isArray(params.times))
			for (let i = 0; i < remaining.length; i++)
				remaining[i].duration = 0 | (params.times[i + 1] * config.duration);

		// if unique easings
		if (isArray(config.easing)) {
			for (let i = 0; i < remaining.length; i++)
				remaining[i].easing = config.easing[i + 1];

			// remove the config
			delete config.easing;
		}

	}

	// other params
	if (!!params.flip) config.direction = 'alternate';
	if (!!params.loop) config.loop = true;

	// create the animation
	const handler = new AnimationHandler(config, props);

	// check for fast forwarding
	if (params.elapsed)
		handler.animation.seek(params.elapsed);

	// give back the result
	return handler;
}


/** helper for animation handling */
class AnimationHandler {

	constructor(config, props) {
		this.config = config;
		this.props = props;
		this.animation = anime(config);
	}

	// local frame tracking
	lastTick = +new Date;
	currentFrame = 0

	// tick forward
	tick = () => {
		
		// move the animation forward
		const now = +new Date;
		const delta = now - this.lastTick;
		this.currentFrame += delta;
		this.lastTick = now;

		// update the position
		this.animation.tick(this.currentFrame);
	}

	seek = value => this.animation.seek(value)

	stop = () => {
		anime.remove(this.props);
	}

}