import { isArray, isString } from "../utils";

/** expression types */
const EXPRESSIONS = {
	':rnd': getRandom,
	':+': addTo,
	':-': subtractBy,
	':*': multiplyBy,
	':/': divideBy,
	':%': percentOf,
};

/** returns a random number in a range */
export function getRandom(min, max, toInt = true) {
	const value = (Math.random() * (max - min)) + min;
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

/** checks if a node appears to be an expression */
export function isExpression(value) {
	return isArray(value) && isString(value[0]) && value[0][0] === ':';
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
		return handler(...rest);
	}
	catch (ex) {
		console.error(`Failed to evaluate expression ${token} with ${rest.join(', ')}`);
		throw ex;
	}
}