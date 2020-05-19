import { isArray, isString } from "../utils";

// defaults to standard Math random function
let randomizer = Math;

/** assigns a randomizer to use for the random expression */
export function setRandomizer(val) {
	randomizer = val;
}

/** expression types */
const EXPRESSIONS = {
	':rnd': getRandom,
	':+': addTo,
	':-': subtractBy,
	':*': multiplyBy,
	':/': divideBy,
	':%': percentOf,
};

const DYNAMICS = { 
	':rx': relativeX
}

/** returns a random number in a range */
export function getRandom(min, max, toInt = true) {

	// single value provided
	if (isNaN(max)) {
		max = min;
		min = 0;
	}

	// randomize
	const value = (randomizer.random() * (max - min)) + min;
	return toInt ? 0|value : value;
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

// value is relative to the x position on screen
export function relativeX(obj, stage, prop, min, max, toInt) {
	const bounds = obj.getBounds();
	const percent = (bounds.x / (stage.width / 2)) / 2;
	const value = ((max - min) * percent) + min;
	obj[prop] = toInt ? 0 | value : value;
}

// value is relative to the x position on screen
export function relativeY(obj, stage, prop, min, max, toInt) {
	const bounds = obj.getBounds();
	const percent = (bounds.y / (stage.height / 2)) / 2;
	const value = ((max - min) * percent) + min;
	obj[prop] = toInt ? 0 | value : value;
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
