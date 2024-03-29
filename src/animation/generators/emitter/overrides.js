import { PIXI } from '../../../pixi/lib';
import * as Particles from 'pixi-particles';
import { RAD } from '../../../utils';



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
	
		// perform normal updateialzation
		let result = update.apply(this, args);

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
		
		// perform normal updateialzation
		init.apply(this, args);

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

