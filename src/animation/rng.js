
import random from 'random-seed';

export default class Random {

	constructor(seed) {
		this.activate(seed);
	}

	/** sets the random seed to use */
	activate = seed => {
		this.seed = seed;
		this.rng = random.create(seed);
	}

	/** random number between 0-1 */
	random = () => {
		return this.rng.random();
	}

	/** random integer within a range */
	int = (...args) => {
		const [min, max] = args.length === 1 ? [0, args[1]] : args;
		return this.rng.intBetween(min, max);
	}

}