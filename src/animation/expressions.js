import { isArray, isString, isNumber, isBoolean, TAU } from "../utils";
// import * as mappings from './mappings';
import * as randomizer from '../randomizer';
import * as variables from './variables';

// dynamic expressions
import GetRandomExpression from './dynamic-expressions/get-random'
import ModExpression from './dynamic-expressions/mod-expression'
import { CosineExpression, SineExpression } from './dynamic-expressions/sine-expressions'
import { RelativeToX, RelativeToY } from './dynamic-expressions/relative-expressions'
import BezierExpression from "./dynamic-expressions/bezier-expression";
import PercentExpression from "./dynamic-expressions/range-expression";
import AverageExpression from "./dynamic-expressions/average-expression";
import SumExpression from "./dynamic-expressions/sum-expression";
import CycleExpression from "./dynamic-expressions/cycle-expression";
import BetweenExpression from "./dynamic-expressions/between-expression";
import { JitterExpression } from "./dynamic-expressions/JitterExpression";
import TweenExpression from "./dynamic-expressions/tween-expression";
import SourceExpression from "./dynamic-expressions/source-expression";
import StepExpression from "./dynamic-expressions/step-expression";
import IncrementExpression from "./dynamic-expressions/increment-expression";

/** expression types */
const EXPRESSIONS = {
  ':+': { func: addTo },
  ':-': { func: subtractBy },
  ':*': { func: multiplyBy },
  ':/': { func: divideBy },
  ':%': { func: percentOf },
  ':exp': { func: expression },
  ':chance': { func: chance },
  ':pick': { func: pick },
  ':seq': { func: sequence },
  ':sequence': { func: sequence },
  ':range': { func: range },
  ':var': { func: getVariable },
  ':random': { func: getRandom }
}

const DYNAMICS = {
  ':inc': { instance: IncrementExpression },
  ':sum': { instance: SumExpression },
  ':cycle': { instance: CycleExpression },
  ':avg': { instance: AverageExpression },
  ':jit': { instance: JitterExpression },
  ':mod': { instance: ModExpression },
  ':step': { instance: StepExpression },
  ':src': { instance: SourceExpression },
  ':percent': { instance: PercentExpression },
  ':between': { instance: BetweenExpression },
  ':tween': { instance: TweenExpression },
  ':cos': { instance: CosineExpression },
  ':sin': { instance: SineExpression },
  ':bez': { instance: BezierExpression },
  ':rnd': { instance: GetRandomExpression },
  ':rx': { instance: RelativeToX },
  ':ry': { instance: RelativeToY }
}

function getRandom(min, max, asInt) {
  let val = ((max - min) * Math.random()) + min
  if (asInt) {
    val = 0 | val
  }

  return val
}

function getVariable(name) {
  return variables.pull(name);
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

export function chance(...args) {
  let convert = val => val;
  
  // collect up options and get args
  let choices = [ ];
  for (const option of args) {
    if (option === 'int') {
      convert = parseInt;
    }
    else if (option === 'float') {
      convert = parseBool;
    }
    else if (option === 'bool') {
      convert = val => !!val;
    }
    else if (typeof option === 'object') {
      for (const key in option) {
        const chance = option[key];
        choices.push({ value: key, chance });
      }
    }
  }

  // sort them by most likely to least likely
  choices.sort((a, b) => b.chance - a.chance);

  // sum up the total options
  let sum = 0;
  for (const choice of choices) {
    sum += choice.chance;
    choice.threshold = sum;
  }

  // make the selection
  let [ match ] = choices;
  const selected = Math.random() * sum;
  for (const option of choices) {
    if (selected < option.threshold) {
      match = option;
      break;
    }
  }

  // return the result
  return convert(match.value);
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
    // val = action(val, args[i + 1]);
    val = action(val, ...args.slice(1));
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
