import { PIXI } from '../../../pixi/lib';
import * as Particles from 'pixi-particles';
import { RAD } from '../../../utils';

// PIXI.Transform.prototype.updateTransform = function(parentTransform) {
// 	const lt = this.localTransform;
	
// 	if (this._localID !== this._currentLocalID)
// 	{
// 			const scaleX = this.scale.x;
// 			const scaleY = this.scale.y;
// 			const pivotX = this.pivot.x;
// 			const pivotY = this.pivot.y;
			
// 			// get the matrix values of the displayobject based on its transform properties..
// 			lt.a = this._cx * scaleX;
// 			lt.b = this._sx * scaleX;
// 			lt.c = this._cy * scaleY;
// 			lt.d = this._sy * scaleY;
// 			lt.tx = this.position.x - ((pivotX * lt.a) + (pivotY * lt.c));
// 			lt.ty = this.position.y - ((pivotX * lt.b) + (pivotY * lt.d));
// 			this._currentLocalID = this._localID;

// 			// force an update..
// 			this._parentID = -1;
// 	}

// 	if (this._parentID !== parentTransform._worldID)
// 	{
// 			// concat the parent matrix with the objects transform.
// 			const pt = parentTransform.worldTransform;
// 			const wt = this.worldTransform;

// 			wt.a = (lt.a * pt.a) + (lt.b * pt.c);
// 			wt.b = (lt.a * pt.b) + (lt.b * pt.d);
// 			wt.c = (lt.c * pt.a) + (lt.d * pt.c);
// 			wt.d = (lt.c * pt.b) + (lt.d * pt.d);
// 			wt.tx = (lt.tx * pt.a) + (lt.ty * pt.c) + pt.tx;
// 			wt.ty = (lt.tx * pt.b) + (lt.ty * pt.d) + pt.ty;

// 			this._parentID = parentTransform._worldID;

// 			// update the id of the transform..
// 			this._worldID++;
// 	}

// 	this.firstPassIsDone = true;
// };

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
	if (this.rotationModifier) {
		this.rotation += this.rotationModifier;
	}

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
		hasRandomStartRotation,
		hasDefinedRotationOffset,
		definedRotationOffset
	} = this.emitter.config;
	
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

	// if there's a constant rotation applied, then
	// this should be every frame. otherwise, do it
	// once any stop
	if (!!rotationSpeed) {
		this.rotationModifier = undefined;
	}

};

