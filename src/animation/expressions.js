import { isArray, isString, isNumber, isBoolean } from "../utils";
import * as mappings from './mappings';

// defaults to standard Math random function
let randomizer = Math;

/** assigns a randomizer to use for the random expression */
export function setRandomizer(val) {
	randomizer = val;
}

/** expression types */
const EXPRESSIONS = {
	':+': addTo,
	':-': subtractBy,
	':*': multiplyBy,
	':/': divideBy,
	':%': percentOf,
	':exp': expression,
	':pick': pick,
	':seq': sequence,
	':sequence': sequence,
	':range': range,
};

const DYNAMICS = {
	':rnd': getRandom,
	':rx': relativeX,
	':ry': relativeY,
}

export function addTo(add, relativeTo) {
	return relativeTo + add;
}

export function subtractBy(subtract, relativeTo) {
	return relativeTo - subtract;
}

export function multiplyBy(multiply, relativeTo) {
	return relativeTo * multiply;
}

export function divideBy(divide, relativeTo) {
	return relativeTo / divide;
}

export function percentOf(percent, relativeTo) {
	return relativeTo * (percent / 100);
}

export function range(...params) {
	
	// sort out the params
	const toInt = !~params.indexOf('decimal');

	// extract the value
	let [min, max] = params;
	if (isNaN(max)) {
		max = min;
		min = 0;
	}

	// randomize
	const value = (randomizer.random() * (max - min)) + min;
	return toInt ? 0|value : value;

}

export function expression(...args) {
	let val = args[0];
	for (let i = 1; i < args.length; i += 2) {
		const action = EXPRESSIONS[args[i]];
		val = action(val, args[i + 1]);
	}

	return isNaN(val) ? 0 : val;
}

export function pick(...args) {
	return args[Math.floor(args.length * randomizer.random())];
}

// TODO: this is just a temp solution -- because each
// sequence array would be unique, there isn't actually any way
// to keep a shared sequence without an identity - this uses
// the array as a string for a reference
const SEQUENCES = { };
export function sequence(...args) {

	// create a key to allow for a shared list
	const key = args.join('::');
	let sequence = SEQUENCES[key];

	// if not shared yet, share it now
	if (!sequence) {
		SEQUENCES[key] = sequence = args;
		
		// check if shuffled
		if (sequence[0] === ':shuffle') {
			sequence.shift();
			shuffle(sequence);
		}
	}

	// cycle the item
	const selected = sequence.pop();
	sequence.unshift(selected);
	return selected;
}

// extract args
export function getRelativeArgs(args) {
	let [min, max] = args;
	const param1 = args[2];
	const param2 = args[3];
	const flip = param1 === 'flip' || param2 === 'flip';
	const toInt = param1 === 'int' || param2 === 'int';
	return [min, max, flip, toInt]
}

// value is relative to the x position on screen
export function relativeX(obj, stage, prop, ...args) {
	const bounds = obj.getBounds();
	calculateRelative(obj, prop, args, bounds.x, stage.width);
}

// value is relative to the x position on screen
export function relativeY(obj, stage, prop, ...args) {
	const bounds = obj.getBounds();
	calculateRelative(obj, prop, args, bounds.y, stage.height);
}

// calculates a relative position from bounds and a relative value
function calculateRelative(obj, prop, args, at, relativeTo) {
	const [min, max, flip, toInt] = getRelativeArgs(args);

	// calculate the percent
	let percent;

	// flips at center
	if (flip) {
		const cx = relativeTo / 2;
		percent = Math.abs((at - cx) / cx);
	}
	// full range
	else {
		percent = at / relativeTo;
	}

	// specials
	if (prop === 'visible') {
		obj.visible = percent > min && percent < max;
		return;
	}
	
	const value = ((max - min) * percent) + min;
	if (!isFinite(value) || isNaN(value)) return;
	
	// assign the value
	const mapping = mappings.lookup(prop);
	mapping(obj, toInt ? 0 | value : value);
}


/** returns a random number in a range */
export function getRandom(obj, stage, prop, ...params) {
	const mapping = mappings.lookup(prop);
	
	
	// check for a cached value
	const cacheKey = `___cache_${prop}___`;
	const cached = obj[cacheKey];

	// apply the cached value
	if (cached !== undefined) {
		mapping(obj, cached);
		return;
	}

	// sort out the params
	const toInt = !~params.indexOf('decimal');
	const isVariable = !!~params.indexOf('var');

	// extract the value
	let [min, max] = params;
	if (isNaN(max)) {
		max = min;
		min = 0;
	}

	// randomize
	const value = (randomizer.random() * (max - min)) + min;
	const result = toInt ? 0|value : value;

	// cache, if needed
	if (!isVariable) {
		obj[cacheKey] = result;
	}

	// save the result
	mapping(obj, result);
}

/** checks if a node appears to be an expression */
export function isExpression(value) {
	return isArray(value) && isString(value[0]) && !!EXPRESSIONS[value[0]];
}

/** checks if a node appears to be an expression */
export function isDynamic(value) {
	return isArray(value) && isString(value[0]) && !!DYNAMICS[value[0]];
}

/** evaluates an expression node */
export function evaluateExpression(expression, ...args) {
	if (!isExpression(expression)) return expression;
	const [token] = expression;
	const handler = EXPRESSIONS[token];
	const rest = expression.slice(1);	
	rest.push.apply(rest, args);

	// this expression will probably fail
	if (!handler) {
		console.error(`No expression handler was found for token ${token}`);
		return null;
	}

	try {
		return handler.apply(this, rest);
	}
	catch (ex) {
		console.error(`Failed to evaluate expression ${token} with ${rest.join(', ')}`);
		throw ex;
	}
}

/** generates a function for dynamic evaluation */
export function createDynamicExpression(prop, source, ...args) {
	const expression = source[prop];

	// not a dynamic property
	if (!isDynamic(expression)) return expression;

	const [token] = expression;
	const handler = DYNAMICS[token];
	const rest = expression.slice(1);	

	// include the property name to update
	rest.unshift(prop);
	
	// include any extra configs
	rest.push.apply(rest, args);

	// create the handler function
	return (...params) => {
		const args = [].concat(params).concat(rest);
		return handler.apply(null, args);
	};
}


// shuffle an array without changing the reference
function shuffle(items) {
	const shuffled = [ ];
	for (let i = items.length; i-- > 0;) {
		const index = Math.floor(items.length & randomizer.random());
		shuffled.push.apply(shuffled, items.splice(index, 1));
	}

	// repopulate the array
	items.push.apply(items, shuffled);
}