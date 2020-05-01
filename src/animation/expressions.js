import { isArray } from "../utils";

/** expression types */
const EXPRESSIONS = {
	rnd: getRandom,
	'+': addTo,
	'-': subtractBy,
	'*': multiplyBy,
	'/': divideBy
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

/** checks if a node appears to be an expression */
export function isExpression(value) {
	return isArray(value) && !!EXPRESSIONS[value[0]];
}

/** evaluates an expression node */
export function evaluateExpression(expression, ...args) {
	if (!isExpression(expression)) return expression;
	const handler = EXPRESSIONS[expression[0]];
	const rest = expression.slice(1);
	rest.push.apply(rest, args);
	return handler ? handler(...rest) : null;
}