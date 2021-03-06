import { isArray, isNil } from ".";

// single depth flattening
export function flatten(collection) {
	let items = [ ];

	for (let item of collection) {
		if (isArray(item)) items = items.concat(item);
		else items.push(item);
	}

	return items;
}

// simple map function
export function map(source, action) {
	const keep = [ ];
	if (isArray(source))
		for (let i = 0; i < source.length; i++)
			keep.push(action(source[i], i));

	else
		for (let i in source)
			keep.push(action(source[i], i));
	return keep;
}

/** finds the first item in a collection */
export function first(...items) {
	items = flatten(items);
	for (const item of items)
		if (!isNil(item)) return item;
}