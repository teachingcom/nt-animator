import { PIXI } from '../../../pixi/lib';
import * as Particles from 'pixi-particles';
import { RAD } from '../../../utils';
import { BLEND_MODES } from 'pixi.js';



/** NOTE: This will override default PIXI Particle behavior
 * When creating a new particle this will define random start
 * rotations for particles, if needed
 */
const DEFAULT_RANDOM_ROTATIONS = [ 0, 360 ];

function applyParticleOverride(target) {
	const init = target.prototype.init;
	const update = target.prototype.update;

	// override the update function
	target.prototype.update = function (...args) {
		const now = Date.now() 



		// perform normal updateialzation
		let x = this.x
		let y = this.y
		let result = update.apply(this, args);

		if (this.__wave) {
			this.y = this.__wave.y + this.__wave.func((now + this.__wave.offset) * this.__wave.freq * 0.001) * this.__wave.amp;
		}

		// customs scripts
		if (this.__leaf) {
			const { ts, tx, ty, xm, ym, sy, sx, ry, rx, rs, cx, gy } = this.__leaf
			this.__leaf.cy -= this.__leaf.py
			this.__leaf.py *= gy
			this.y = ym((now + ts + ty) * sy) * ry + this.__leaf.cy
			this.x = x - (cx + xm((now + ts + tx) * sx) * rx)

			this.scale.x *= rs
			this.scale.y *= rs
		}

		// apply the default starting rotation
		if (this.rotationModifier) {
			this.rotation += this.rotationModifier;
		}

		// perform flipping
		if (this.lastKnownScaleX !== this.scale.x) {
			
			// allow sprite flipping on x axis
			if (this.emitter.config.flipParticleX) {
				this.scale.x *= -1;
			}
			
			if (this.randomFlipX === -1) {
				this.scale.x *= -1;
			}
		}

		if (this.lastKnownScaleY !== this.scale.y) {
			// allow sprite flipping on y axis
			if (this.emitter.config.flipParticleY) {
				this.scale.y *= -1;
			}
			
			if (this.randomFlipY === -1) {
				this.scale.y *= -1;
			}
		}

		this.lastKnownScaleX = this.scale.x;
		this.lastKnownScaleY = this.scale.y;
		
		return result;
	};

	target.prototype.init = function (...args) {
		const now = Date.now()

		// perform normal updateialzation
		init.apply(this, args);

		// has a wave effect
		if (!!this.emitter.config.custom?.wave) {
			this.__wave = {
				y: this.y,
				amp: this.emitter.config.custom?.wave.amp,
				freq: this.emitter.config.custom?.wave.freq,
				func: this.emitter.config.custom?.wave.func === 'sin' ? Math.sin : Math.cos,
				offset: Math.random() * (this.emitter.config.custom?.wave.offset || 1000),
			}
		}

		// Ideally we'd use behaviors, but that's not in this version of PIXI particles
		// include custom leaf behaviors
		if (!!this.emitter.config.custom?.leaf) {
			const {
				x = [3, 5],
				rx = [1, 2],
				ry = [10, 25],
				py = [5, 10],
				gy = [0.7, 0.9],
				rs = [1, 1],
				scale = 0.01,
				blend = 1
			} = this.emitter.config.custom?.leaf ?? { }

			this.blendMode = Math.random() > blend ? BLEND_MODES.ADD : BLEND_MODES.NORMAL

			this.__leaf = {
				xm: Math.random() < 0.5 ? Math.sin : Math.cos,
				cx: getValue(x),
				rx: getValue(rx),
				sx: Math.random() * scale,
				tx: Math.random() * 5000,
				ym: Math.random() < 0.5 ? Math.sin : Math.cos,
				py: getValue(py),
				gy: getValue(gy),
				rs: getValue(rs),
				cy: 0,
				ry: getValue(ry),
				sy: Math.random() * scale,
				ty: Math.random() * 5000,
				ts: now
			}
		}

		// apply the default starting rotation
		const {
			rotationSpeed,
			tint,
			randomStartRotation,
			hasRandomStartRotation,
			hasAssignedTint,
			hasDefinedRotationOffset,
			definedRotationOffset,
			randomFlip
		} = this.emitter.config;

		if (hasAssignedTint) {
			const index = Math.floor(Math.random() * tint.length);
			this.tint = tint[index];
		}
		
		// has a defined start rotation
		if (hasDefinedRotationOffset) {
			this.rotation = this.rotationModifier = definedRotationOffset;
		}
		// has a random range of start rotations
		else if (hasRandomStartRotation) {
			const [min, max] = randomStartRotation || DEFAULT_RANDOM_ROTATIONS;
			const angle = (Math.random() * (max - min)) + min;
			this.rotation = this.rotationModifier = angle * RAD;
		}
		// no rotation modification
		else {
			this.rotation = this.rotationModifier = 0;
		}

		// set the default
		this.randomFlipX = 1;
		this.randomFlipY = 1;
		this.lastKnownScaleX = null;
		this.lastKnownScaleY = null;

		if (randomFlip === 'x') {
			this.randomFlipX = Math.random() > 0.5 ? -1 : 1;
		}
		else if (randomFlip === 'y') {
			this.randomFlipY = Math.random() > 0.5 ? -1 : 1;
		}
		else if (randomFlip === 'any') {
			this.randomFlipX = Math.random() > 0.5 ? -1 : 1;
			this.randomFlipY = Math.random() > 0.5 ? -1 : 1;
		}
		else if (!!randomFlip) {
			const flip = Math.random() > 0.5 ? -1 : 1;
			this.randomFlipX = flip;
			this.randomFlipY = flip;
		}

		// if there's a constant rotation applied, then
		// this should be every frame. otherwise, do it
		// once any stop
		if (!!rotationSpeed) {
			this.rotationModifier = undefined;
		}
	
	};

}

applyParticleOverride(Particles.AnimatedParticle);
applyParticleOverride(Particles.Particle);


const getValue = (values) => values.length === 2 ? ((values[1] - values[0]) * Math.random()) + values[0] : values