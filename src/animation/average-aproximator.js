
const SAMPLES = 2000
const SMOOTH = 100

export default class AverageSequenceAproximator {

	static cache = { }

	static create(values, invert) {
		// create the key for this
		const key = [
			...values.map(simplified),
			invert ? 1 : 0
		].join(':')

		// check if this was already generated
		let instance = AverageSequenceAproximator.cache[key]
		if (!instance) {
			instance = new AverageSequenceAproximator(values, invert)
			AverageSequenceAproximator.cache[key] = instance
		}
		
		return instance
	}

	// creates a new aproximator
	constructor(values, invert) {
		this.values = values;
		this.invert = invert;
		this._precalculate()
	}

	// get a value from the lut
	calc(val) {
		return this._lut[0 | (val % this._total)]
	}

	// preloads a look up table of values
	_lut = [ ]
	_precalculate() {
		const { values, invert } = this
		
		// determine how many sections to create
		const total = values.length
		const section = 0 | (SAMPLES / total)
		const count = section * total

		// create a scaled range of values
		const samples = [ ]
		for (let i = 0; i < count; i++) {
			const percent = (i % section) / section;
			const current = 0 | (i / section);
			const next = (current + 1) % total;
			const val = lerp(values[current], values[next], percent)
			samples.push(val);
		}

		// if it should play back in reverse, create the backside samples
		if (invert) {
			const inverted = [ ...samples ]
			inverted.reverse()
			samples.concat(inverted)
		}

		// try and smooth out the transitions a bit
		// this just averages all samples together - it also
		this._total = samples.length;
		for (let i = 0; i < this._total; i++) {
			const wrap = i + this._total
			const avg = SMOOTH

			// gather nearby values
			let current = samples[i]
			for (let j = 1; j < avg; j++) {
				current += samples[(i + j) % this._total]
				current += samples[((wrap) - j) % this._total]
			}

			this._lut[i] = current / ((avg * 2) + 1)
		}
	}
}


function simplified(val) {
	return (0 | (val * 100)) / 100
}

function lerp(x, y, t) {
	return x * (1 - t) + y * t
}
