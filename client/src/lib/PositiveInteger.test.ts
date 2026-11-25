import { describe, expect, it } from 'vitest'
import { PositiveInteger } from './PositiveInteger.ts'

describe('PositiveInteger', () => {
  it('parses canonical positive integers', () => {
    expect(PositiveInteger.parse('1')).toBe(1)
    expect(PositiveInteger.parse('436535')).toBe(436535)
  })

  it('rejects everything else', () => {
    for (const value of [null, undefined, '', '0', '-1', '01', '1.0', '1e3', ' 1', 'one', '99999999999999999999']) {
      expect(PositiveInteger.parse(value)).toBeNull()
    }
  })

  it('respects an upper bound', () => {
    expect(PositiveInteger.parse('10', 9)).toBeNull()
    expect(PositiveInteger.isValid(9, 9)).toBe(true)
    expect(PositiveInteger.isValid(1.5)).toBe(false)
  })
})
