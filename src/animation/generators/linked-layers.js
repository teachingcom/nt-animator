
export default class LinkedLayers {

	layers = [ ];

	/** create a new set of linked layers */
	constructor(layers) {
		this.layers.push.apply(this, layers);
	}

	/** includes a layer */
	add(layer) {
		this.layers.push(layer);
	}

	/** performs an action on linked layer */
	each(action) {
		const { layers } = this;
		const total = layers.length;
		for (let i = 0; i < total; i++)
			action(layers[i], i)
	}

}