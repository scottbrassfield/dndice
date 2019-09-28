export class UnrecognizedError extends Error {
  constructor(message) {
    super(message || 'Mmm what?')
    this.name = 'UnrecognizedError'
  }
}

export function checkValidPrefix(prefix) {
  return prefix === '/r'
}

export function parseRoll(rollStr) {
  let [diceCount, dieSize, modifier] = rollStr
    .split(/([d+-]\s*)/)
    .map(val => val && val.trim())
    .map((val, i, arr) => arr[i - 1] === '-' ? `-${val}` : val)
    .filter(val => !val.match(/d|\+|-$/))
    .map(val => parseInt(val))

  if (!diceCount || !dieSize) {
    throw new UnrecognizedError()
  }

  if (!modifier && typeof modifier !== 'number') {
    modifier = 0
  } else if (isNaN(modifier)) {
    throw new UnrecognizedError()
  }

  return {
    diceCount,
    dieSize,
    modifier
  }
}

export function calculateRollValues({
  diceCount,
  dieSize,
  modifier
}) {
  const rollResults = [];
  while (diceCount > 0) {
    rollResults.push(Math.floor(Math.random() * dieSize) + 1);
    diceCount--;
  }


  return {
    modifier,
    dieSize,
    dice: rollResults,
    total: [...rollResults, modifier].reduce(function (total, res) {
      return total + res;
    }, 0)
  }
}

export function getRollValueFromMessage(message) {
  const [prefix, ...rollParts] = message.split(' ')

  // If prefix is invalid, ignore this message
  if (!checkValidPrefix(prefix)) {
    return
  }

  // If no roll parts were provided or are malformed, throw an error
  if (!rollParts || !Array.isArray(rollParts) || !rollParts.length) {
    throw new UnrecognizedError()
  }

  // Parse roll into useable components
  const rollStr = rollParts.length === 1 ? rollParts[0] : rollParts.join('')
  let rollComponents = parseRoll(rollStr)

  return calculateRollValues(rollComponents)
}