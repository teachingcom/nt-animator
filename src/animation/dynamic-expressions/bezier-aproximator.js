function simplified(val) {
	return (0 | (val * 100)) / 100;
}

export default class BezierAproximator {

	static cached = { }

	// creates a new bezier aproximation
	static create(a, b, c, d, linear) {
		a = simplified(a)
		b = simplified(b)
		c = simplified(c)
		d = simplified(d)
		linear = linear ? 1 : 0

		// check if already created
		const key = [a, b, c, d, linear].join(':')
		let instance = BezierAproximator.cached[key]
		if (instance) {
			return instance;
		}

		// create and save
		instance = new BezierAproximator(a, b, c, d, linear)
		BezierAproximator.cached[key] = instance
		return instance
	}

	constructor(a, b, c, d, linear) {
		this.a = a
		this.b = b
		this.c = c
		this.d = d
		this.linear = linear

		// Calculate constants in parametric bezier formular
		// http://www.moshplant.com/direct-or/bezier/math.html
		this.cX = 3 * a
		this.bX = 3 * (c - a) - this.cX
		this.aX = 1 - this.cX - this.bX
		this.cY = 3 * b
		this.bY = 3 * (d - b) - this.cY
		this.aY = 1 - this.cY - this.bY

		// prepopulate values
		this._precalculate()
	}

	// look up table of values so this isn't
	// constantly calculated
	_lut = [ ]

	// Functions for calculating x, x', y for t
	_bezierX(t){
		return t * (this.cX + t * (this.bX + t * this.aX))
	}

	_bezierXDerivative(t) {
		return this.cX + t * (2 * this.bX + 3 * this.aX * t)
	}

	// Use Newton-Raphson method to find t for a given x.
	// Since x = a*t^3 + b*t^2 + c*t, we find the root for
	// a*t^3 + b*t^2 + c*t - x = 0, and thus t.
	_newtonRaphson(x) {
		let prev;
		let t = x;
		do {
			prev = t;
			t = t - ((this._bezierX(t) - x) / this._bezierXDerivative(t))
		} while (Math.abs( t - prev ) > 1e-4)
 
		return t
	}

	// precalculate all values
	_precalculate() {
		const lut = [ ]

		// calculate all values
		for (let i = 0; i < 1; i += 0.005) {
			const t = this._newtonRaphson(i) || 0
			const v = t * (this.cY + t * (this.bY + t * this.aY))
			lut.push(v)
		}

		this._lut = lut;
		this._lut = [ ...lut ];

		lut.reverse();
		this._lut = [ ...this._lut, ...lut ]
		this._total = this._lut.length

	}

	calc(t) {
		t = (t * 100)
		// t = (t * min) + (t * max) - (t * min)
		if (t < 0) {
			t = 200 + t
		}

		return this._lut[t % this._total]
	}

}