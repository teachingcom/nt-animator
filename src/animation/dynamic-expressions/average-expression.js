import AverageSequenceAproximator from '../average-aproximator'
import * as mappings from '../mappings'


export default class AverageExpression {

	static start = Date.now()

  offset = 0
  scale = 1
  flip = false
	startAt = 0
	endAt = 0

  constructor (prop, args) {
		this.prop = prop
		this.mapping = mappings.lookup(prop)
		this.values = [ ]

		// get remaining args
		let isGatheringNumbers = true;
    for (const arg of args) {

			// the first arguments are expected to be the range
			if (isGatheringNumbers) {
				const val = parseFloat(arg)
				if (!isNaN(val)) {
					this.values.push(val)
					continue;
				}
				// done gathering numbers
				else {
					isGatheringNumbers = false
				}

			}

			// check for other args
			if (arg === 'int') {
        this.convertToInt = true
      }
			else if ('min' in arg) {
        this.min = parseFloat(arg.min)
      }
			else if ('max' in arg) {
        this.max = parseFloat(arg.max)
      }
			else if (arg === 'invert') {
				this.flip = true
			}
      else if (arg.scale) { 
        this.scale = arg.scale * 0.1
      }
      else if (arg.offset) { 
        this.offset = arg.offset * 1000
      }
    }
    
    // save the args
    this.avg = AverageSequenceAproximator.create(this.values, this.flip)
		this.range = this.max - this.min
  }

  update = (target, stage) => {
    const ts = ((Date.now() - AverageExpression.start) + this.offset) * this.scale
		const scale = this.avg.calc(ts);
		const value = this.min + (this.range * scale);

		// apply the value
		this.mapping(target, (this.convertToInt ? 0 | value : value))
  }

}


// function createCubicBezier( p1x, p1y, p2x, p2y ) {
// 	// Calculate constants in parametric bezier formular
// 	// http://www.moshplant.com/direct-or/bezier/math.html
// 	var cX = 3 * p1x,
// 		bX = 3 * ( p2x - p1x ) - cX,
// 		aX = 1 - cX - bX,
 
// 		cY = 3 * p1y,
// 		bY = 3 * ( p2y - p1y ) - cY,
// 		aY = 1 - cY - bY;
 
// 	// Functions for calculating x, x', y for t
// 	var bezierX = function ( t ) {
// 		return t * ( cX + t * ( bX + t * aX ) );
// 	};
// 	var bezierXDerivative = function ( t ) {
// 		return cX + t * ( 2 * bX + 3 * aX * t );
// 	};
 
// 	// Use Newton-Raphson method to find t for a given x.
// 	// Since x = a*t^3 + b*t^2 + c*t, we find the root for
// 	// a*t^3 + b*t^2 + c*t - x = 0, and thus t.
// 	var newtonRaphson = function ( x ) {
// 		var prev,
// 			// Initial estimation is linear
// 			t = x;
// 		do {
// 			prev = t;
// 			t = t - ( ( bezierX( t ) - x ) / bezierXDerivative( t ) );
// 		} while ( Math.abs( t - prev ) > 1e-4 );
 
// 		return t;
// 	};

// 	return function ( x ) {
// 		var t = newtonRaphson( x );
// 		// This is y given t on the bezier curve.
// 		return t * ( cY + t * ( bY + t * aY ) );
// 	}
// };


// // // B(t) = (1 - t)^3P0 + 3(1 - t)^2tP1 + 3(1 - t)t^2P2 + t^3P3
// // function interpolateCubicBezier(start, control1, control2, end) {
// // 	// 0 <= t <= 1
// // 	return function interpolator(t) {
// // 		return [
// //       (Math.pow(1 - t, 3) * start[0]) +
// //       (3 * Math.pow(1 - t, 2) * t * control1[0]) +
// //       (3 * (1 - t) * Math.pow(t, 2) * control2[0]) +
// // 			(Math.pow(t, 3) * end[0]),
// // 			(Math.pow(1 - t, 3) * start[1]) +
// //       (3 * Math.pow(1 - t, 2) * t * control1[1]) +
// //       (3 * (1 - t) * Math.pow(t, 2) * control2[1]) +
// // 			(Math.pow(t, 3) * end[1]),
// // 		];
// // 	};
// // }