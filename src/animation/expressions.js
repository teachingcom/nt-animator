import { isArray, isString } from "../utils";
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

// value is relative to the x position on screen
export function relativeX(obj, stage, prop, min, max, toInt) {
	const bounds = obj.getBounds();
	const percent = (bounds.x / (stage.width / 2)) / 2;
	const value = ((max - min) * percent) + min;
	const mapping = mappings.lookup(prop);
	mapping(obj, toInt ? 0 | value : value);
}

// value is relative to the x position on screen
export function relativeY(obj, stage, prop, min, max, toInt) {
	const bounds = obj.getBounds();
	const percent = (bounds.y / (stage.height / 2)) / 2;
	const value = ((max - min) * percent) + min;
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
