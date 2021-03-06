import { isArray, isString, isNumber, isBoolean, TAU } from "../utils";
import * as mappings from './mappings';
import * as randomizer from '../randomizer';

// dynamic expressions
import GetRandomExpression from './dynamic-expressions/get-random'
import ModExpression from './dynamic-expressions/mod-expression'
import { CosineExpression, SineExpression } from './dynamic-expressions/sine-expressions'
import { RelativeToX, RelativeToY } from './dynamic-expressions/relative-expressions'
import BezierExpression from "./dynamic-expressions/bezier-expression";
import AverageExpression from "./dynamic-expressions/average-expression";

/** expression types */
const EXPRESSIONS = {
  ':+': { func: addTo },
  ':-': { func: subtractBy },
  ':*': { func: multiplyBy },
  ':/': { func: divideBy },
  ':%': { func: percentOf },
  ':exp': { func: expression },
  ':pick': { func: pick },
  ':seq': { func: sequence },
  ':sequence': { func: sequence },
  ':range': { func: range }
}

const DYNAMICS = {
  ':avg': { instance: AverageExpression },
  ':mod': { instance: ModExpression },
  ':cos': { instance: CosineExpression },
  ':sin': { instance: SineExpression },
  ':bez': { instance: BezierExpression },
  ':rnd': { instance: GetRandomExpression },
  ':rx': { instance: RelativeToX },
  ':ry': { instance: RelativeToY }
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
    return handler.func.apply(this, rest);
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
  rest.push.apply(rest, args);

  // simple function handler
  if (handler.func) { 

    // include the property name to update
    rest.unshift(prop);

    // create the handler
    return (...params) => {
      return handler.func.call(null, ...params, ...rest);
    };

  // instance based updater
  } else {
    const instance = new handler.instance(prop, rest)
    return instance.update
  }

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
