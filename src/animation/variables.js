const variables = { };

// saves a value
export function save(name, value) {
	variables[name] = value;
}

// grabs a stored value
export function pull(name) {
	return variables[name];
}