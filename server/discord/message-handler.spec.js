import {
  checkValidPrefix,
  getRollValueFromMessage,
  parseRoll,
  UnrecognizedError
} from './message-handler';

describe('checkValidPrefix', () => {
  it('should return true for proper prefix', () => {
    expect(checkValidPrefix('/r')).toEqual(true)
  })

  it('should return false if slash is missing', () => {
    expect(checkValidPrefix('r')).toEqual(false)
  })

  it('should return false if r is missing', () => {
    expect(checkValidPrefix('/')).toEqual(false)
  })

  it('should return false if extra letters are appended is missing', () => {
    expect(checkValidPrefix('/r1')).toEqual(false)
  })
})

describe('parseRoll', () => {
  it('should return parsed roll when passed roll string with no spaces', () => {
    expect(parseRoll('1d20+5')).toEqual({
      diceCount: 1,
      dieSize: 20,
      modifier: 5
    })
  })

  it('should return parsed roll when passed roll with negative modifier', () => {
    expect(parseRoll('1d20-5')).toEqual({
      diceCount: 1,
      dieSize: 20,
      modifier: -5
    })
  })


  it('should return parsed roll when passed roll string with all spaces', () => {
    expect(parseRoll('1d8 + 10')).toEqual({
      diceCount: 1,
      dieSize: 8,
      modifier: 10
    })
  })

  it('should return parsed roll when passed roll string with some spaces', () => {
    expect(parseRoll('3d12 + 11')).toEqual({
      diceCount: 3,
      dieSize: 12,
      modifier: 11
    })
  })

  it('should throw if passed gibberish', () => {
    expect(() => parseRoll('hahaha')).toThrow(UnrecognizedError)
    expect(() => parseRoll('1-d0+3')).toThrow(UnrecognizedError)
    expect(() => parseRoll('3dd+3')).toThrow(UnrecognizedError)
  })

  it('should throw if diceCount is missing', () => {
    expect(() => parseRoll('d20+6')).toThrow(UnrecognizedError)
  })

  it('should throw if diceCount is invalid', () => {
    expect(() => parseRoll('invalidd20+6')).toThrow(UnrecognizedError)
  })

  it('should throw if dieSize is missing', () => {
    expect(() => parseRoll('1d+6')).toThrow(UnrecognizedError)
  })

  it('should throw is dieSize is invalid', () => {
    expect(() => parseRoll('1dinvalid+6')).toThrow(UnrecognizedError)
  })

  it('should return 0 modifier value if modifier is missing', () => {
    expect(parseRoll('1d20')).toEqual({
      diceCount: 1,
      dieSize: 20,
      modifier: 0
    })
  })

  it('should throw if modifier is invalid', () => {
    expect(() => parseRoll('1d20+invalid')).toThrow(UnrecognizedError)
  })
})

describe('getRollValueFromMessage', () => {
  it('should return roll value within expected range when passed one die', () => {
    let {
      total
    } = getRollValueFromMessage('/r 1d6 + 3')

    expect(total).toBeGreaterThanOrEqual(4)
    expect(total).toBeLessThanOrEqual(9)
  })

  it('should return roll value within expected range when passed multiple dice', () => {
    let {
      total
    } = getRollValueFromMessage('/r 2d8 + 10')

    expect(total).toBeGreaterThanOrEqual(12)
    expect(total).toBeLessThanOrEqual(26)
  })

  it('should return roll value within expected range when passed negative modifier', () => {
    let {
      total
    } = getRollValueFromMessage('/r 1d8 - 2')

    expect(total).toBeGreaterThanOrEqual(-1)
    expect(total).toBeLessThanOrEqual(6)
  })
})