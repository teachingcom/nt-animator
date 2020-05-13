import * as Particles from 'pixi-particles';
import { RAD } from '../../utils';

// NOTE: this overrides default PIXI behavior for particles
// There are several properties about particles that cannot be
// adjusted using the configuration. This overrides the update process
// to use the normal update sequence, but then apply additional
// modifiers
// Particles traveling to the left are flipped upside down since their
// "direction" is technically 180 degrees. This this change allows for
// sprites to have their images flipped or rotated based on a starting
// value. 
const __override_update__ = Particles.Particle.prototype.update;
Particles.Particle.prototype.update = function (...args) {
	
	// perform normal updateialzation
	__override_update__.apply(this, args);

	// apply the default starting rotation
	if (this.rotationModifier)
		this.rotation += this.rotationModifier;

	// allow sprite flipping on x axis
	if (this.emitter.config.flipParticleX && this.scale.x > 0)
		this.scale.x *= -1;

	// allow sprite flipping on y axis
	if (this.emitter.config.flipParticleY && this.scale.y > 0)
		this.scale.y *= -1;
	
};


/** NOTE: This will override default PIXI Particle behavior
 * When creating a new particle this will define random start
 * rotations for particles, if needed
 */
const DEFAULT_RANDOM_ROTATIONS = [ 0, 360 ];
const __override_init__ = Particles.Particle.prototype.init;
Particles.Particle.prototype.init = function (...args) {
	
	// perform normal updateialzation
	__override_init__.apply(this, args);

	// apply the default starting rotation
	const {
		rotationSpeed,
		randomStartRotation,
		hasDefinedRotationOffset,
		definedRotationOffset
	} = this.emitter.config;
	
	// has a defined start rotation
	if (hasDefinedRotationOffset) {
		this.rotation = this.rotationModifier = definedRotationOffset;
	}
	// has a random range of start rotations
	else if (randomStartRotation) {
		const [min, max] = randomStartRotation || DEFAULT_RANDOM_ROTATIONS;
		const angle = (Math.random() * (max - min)) + min;
		this.rotation = this.rotationModifier = angle * RAD;
	}
	// no rotation modification
	else {
		this.rotation = this.rotationModifier = 0;
	}

	// if there's a constant rotation applied, then
	// this should be every frame. otherwise, do it
	// once any stop
	if (!!rotationSpeed) {
		this.rotationModifier = undefined;
	}

};
