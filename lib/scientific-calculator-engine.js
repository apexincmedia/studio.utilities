'use client';

const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'abs']);

const OPERATORS = {
  '+': { precedence: 1, associativity: 'left', args: 2 },
  '-': { precedence: 1, associativity: 'left', args: 2 },
  '*': { precedence: 2, associativity: 'left', args: 2 },
  '/': { precedence: 2, associativity: 'left', args: 2 },
  '^': { precedence: 3, associativity: 'right', args: 2 },
  'u-': { precedence: 4, associativity: 'right', args: 1 },
};

const CONSTANTS = {
  pi: Math.PI,
  e: Math.E,
};

function isOperator(token) {
  return Object.prototype.hasOwnProperty.call(OPERATORS, token);
}

function factorial(value) {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    throw new Error('Factorial requires a non-negative integer.');
  }

  if (value > 170) {
    throw new Error('Factorial input is too large.');
  }

  let result = 1;
  for (let index = 2; index <= value; index += 1) {
    result *= index;
  }
  return result;
}

function applyFunction(name, value, angleMode) {
  const toRadians = angleMode === 'deg' ? (input) => (input * Math.PI) / 180 : (input) => input;
  const fromRadians = angleMode === 'deg' ? (input) => (input * 180) / Math.PI : (input) => input;

  switch (name) {
    case 'sin':
      return Math.sin(toRadians(value));
    case 'cos':
      return Math.cos(toRadians(value));
    case 'tan':
      return Math.tan(toRadians(value));
    case 'asin':
      return fromRadians(Math.asin(value));
    case 'acos':
      return fromRadians(Math.acos(value));
    case 'atan':
      return fromRadians(Math.atan(value));
    case 'log':
      return Math.log10(value);
    case 'ln':
      return Math.log(value);
    case 'sqrt':
      return Math.sqrt(value);
    case 'abs':
      return Math.abs(value);
    default:
      throw new Error(`Unsupported function: ${name}`);
  }
}

function tokenize(expression) {
  const normalized = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/\s+/g, '');

  const tokens = [];
  let index = 0;

  while (index < normalized.length) {
    const char = normalized[index];

    if (/\d|\./.test(char)) {
      let end = index + 1;
      while (end < normalized.length) {
        const nextChar = normalized[end];
        if (/[\d.]/.test(nextChar)) {
          end += 1;
          continue;
        }
        if ((nextChar === 'e' || nextChar === 'E') && /[\d.]/.test(normalized[end - 1])) {
          end += 1;
          if (normalized[end] === '+' || normalized[end] === '-') {
            end += 1;
          }
          while (end < normalized.length && /\d/.test(normalized[end])) {
            end += 1;
          }
        }
        break;
      }
      const numberToken = normalized.slice(index, end);
      if (!/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(numberToken)) {
        throw new Error('Invalid number format.');
      }
      tokens.push(numberToken);
      index = end;
      continue;
    }

    if (/[A-Za-z]/.test(char)) {
      let end = index + 1;
      while (end < normalized.length && /[A-Za-z]/.test(normalized[end])) {
        end += 1;
      }
      tokens.push(normalized.slice(index, end));
      index = end;
      continue;
    }

    if ('+-*/^()!'.includes(char)) {
      tokens.push(char);
      index += 1;
      continue;
    }

    throw new Error(`Unexpected token: ${char}`);
  }

  return tokens;
}

function toRpn(tokens) {
  const output = [];
  const stack = [];
  let previousType = 'start';

  tokens.forEach((token) => {
    if (/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(token)) {
      output.push(token);
      previousType = 'value';
      return;
    }

    if (Object.prototype.hasOwnProperty.call(CONSTANTS, token)) {
      output.push(String(CONSTANTS[token]));
      previousType = 'value';
      return;
    }

    if (FUNCTIONS.has(token)) {
      stack.push(token);
      previousType = 'function';
      return;
    }

    if (token === '(') {
      stack.push(token);
      previousType = '(';
      return;
    }

    if (token === ')') {
      while (stack.length && stack[stack.length - 1] !== '(') {
        output.push(stack.pop());
      }

      if (!stack.length) {
        throw new Error('Mismatched parentheses.');
      }

      stack.pop();

      if (stack.length && FUNCTIONS.has(stack[stack.length - 1])) {
        output.push(stack.pop());
      }

      previousType = 'value';
      return;
    }

    if (token === '!') {
      output.push(token);
      previousType = 'value';
      return;
    }

    let operatorToken = token;
    if (token === '-' && (previousType === 'start' || previousType === 'operator' || previousType === '(' || previousType === 'function')) {
      operatorToken = 'u-';
    }

    if (!isOperator(operatorToken)) {
      throw new Error(`Unsupported operator: ${token}`);
    }

    while (stack.length && isOperator(stack[stack.length - 1])) {
      const current = OPERATORS[operatorToken];
      const top = OPERATORS[stack[stack.length - 1]];
      const shouldPop =
        current.associativity === 'left'
          ? current.precedence <= top.precedence
          : current.precedence < top.precedence;

      if (!shouldPop) break;
      output.push(stack.pop());
    }

    stack.push(operatorToken);
    previousType = 'operator';
  });

  while (stack.length) {
    const token = stack.pop();
    if (token === '(' || token === ')') {
      throw new Error('Mismatched parentheses.');
    }
    output.push(token);
  }

  return output;
}

function evaluateRpn(rpnTokens, angleMode) {
  const stack = [];

  rpnTokens.forEach((token) => {
    if (/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(token)) {
      stack.push(Number.parseFloat(token));
      return;
    }

    if (FUNCTIONS.has(token)) {
      const value = stack.pop();
      if (value === undefined) {
        throw new Error('Missing function operand.');
      }
      const result = applyFunction(token, value, angleMode);
      if (!Number.isFinite(result)) {
        throw new Error('Function result is invalid.');
      }
      stack.push(result);
      return;
    }

    if (token === '!') {
      const value = stack.pop();
      if (value === undefined) {
        throw new Error('Missing factorial operand.');
      }
      stack.push(factorial(value));
      return;
    }

    const operator = OPERATORS[token];
    if (!operator) {
      throw new Error(`Unknown token: ${token}`);
    }

    if (operator.args === 1) {
      const value = stack.pop();
      if (value === undefined) {
        throw new Error('Missing unary operand.');
      }
      stack.push(-value);
      return;
    }

    const right = stack.pop();
    const left = stack.pop();
    if (left === undefined || right === undefined) {
      throw new Error('Missing operator operands.');
    }

    let result;
    switch (token) {
      case '+':
        result = left + right;
        break;
      case '-':
        result = left - right;
        break;
      case '*':
        result = left * right;
        break;
      case '/':
        result = left / right;
        break;
      case '^':
        result = left ** right;
        break;
      default:
        throw new Error(`Unsupported operator: ${token}`);
    }

    if (!Number.isFinite(result)) {
      throw new Error('Math result is not finite.');
    }

    stack.push(result);
  });

  if (stack.length !== 1) {
    throw new Error('The expression could not be resolved.');
  }

  return stack[0];
}

export function evaluateScientificExpression(expression, { angleMode = 'deg' } = {}) {
  if (!expression.trim()) {
    throw new Error('Enter an expression to evaluate.');
  }

  const tokens = tokenize(expression);
  const rpn = toRpn(tokens);
  return evaluateRpn(rpn, angleMode);
}

export function formatScientificResult(value) {
  if (!Number.isFinite(value)) return 'Error';
  if (Math.abs(value) >= 1e10 || (Math.abs(value) > 0 && Math.abs(value) < 1e-6)) {
    return value.toExponential(8).replace(/\.?0+e/, 'e');
  }
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 10,
  });
}
