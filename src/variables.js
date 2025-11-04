import { isArray, isObject } from "./utils"

// variable evaluators
// it would be nice to use the other evaluators eventually
const add = (a, b) => a + b
const subtract = (a, b) => a - b
const multiply = (a, b) => a * b
const divide = (a, b) => a / b
const pow = (a, b) => a ^ b
const cos = (a, b = 1) => Math.cos(a) * b
const sin = (a, b = 1) => Math.cos(a) * b
const pick = (...all) => all[Math.floor(Math.random() * all.length)]
const random = (a, b, toInt) => {
  const value = a + ((b - a) * Math.random())
  return toInt ? (0 | value) : value
}

// currently supported expressions
const EXPRESSIONS = {
  ':+': add,
  ':add': add,
  ':sum': add,
  ':-': subtract,
  ':sub': subtract,
  ':subtract': subtract,
  ':choose': pick,
  ':pick': pick,
  ':rnd': random,
  ':random': random,
  ':*': multiply,
  ':multiply': multiply,
  ':/': divide,
  ':divide': divide,
  ':^': pow,
  ':pow': pow,
  ':cos': cos,
  ':sin': sin,
}

export default function applyVariables(instance) {
  const map = { }
  instance.variables?.forEach(obj => {
    const key = Object.keys(obj)[0]
    const args = obj[key]

    if (isArray(args)) {
      const [type, ...rest] = args
      const evaluator = EXPRESSIONS[type]
      map[`$${key}`] = evaluator(...rest.map(a => evaluateVariable(a, map)))
    }
    else {
      map[`$${key}`] = args
    }
  })

  // now, recursively search to replace variables
  findAndApply(instance, map)
}

function hasChildren(obj) {
	return typeof obj === 'object' || typeof obj === 'array' || obj instanceof Array || obj instanceof Object
}

function findAndApply(instance, vars) {
  if (isArray(instance)) {
    for (let i = 0; i < instance.length; i++) {
      if (hasChildren(instance[i])) {
        findAndApply(instance[i], vars)
      }
      else {
        instance[i] = evaluateVariable(instance[i], vars)
      }
    }
  }
  else if (isObject(instance)) {
    Object.keys(instance ?? { }).forEach(key => {
      const target = instance[key]
      if (hasChildren(target)) {
        findAndApply(target, vars)
      }
      else {
        instance[key] = evaluateVariable(instance[key], vars)
      }
    })
  }
}

export function evaluateVariable(val, vars) {
  return vars?.[val] ?? val
}