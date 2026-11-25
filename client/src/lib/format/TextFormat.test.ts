import { describe, expect, it } from 'vitest'
import { TextFormat } from './TextFormat.ts'

describe('TextFormat', () => {
  describe('count', () => {
    it('uses the singular for exactly one', () => {
      expect(TextFormat.count(1, 'work', 'works')).toBe('1 work')
    })

    it('uses the plural with grouped digits otherwise', () => {
      expect(TextFormat.count(0, 'work', 'works')).toBe('0 works')
      expect(TextFormat.count(1423, 'work', 'works')).toBe('1,423 works')
      expect(TextFormat.count(470_000, 'work', 'works')).toBe('470,000 works')
    })
  })

  it('groups plain numbers', () => {
    expect(TextFormat.number(10_000)).toBe('10,000')
  })

  describe('date', () => {
    it('writes day, short month and year', () => {
      expect(TextFormat.date('2026-11-03T12:00:00.000Z')).toBe('3 Nov 2026')
      expect(TextFormat.date(new Date('2026-09-14T12:00:00.000Z'))).toBe('14 Sep 2026')
    })

    it('returns an empty string for an invalid date', () => {
      expect(TextFormat.date('not a date')).toBe('')
    })
  })

  describe('clip', () => {
    it('leaves short text alone', () => {
      expect(TextFormat.clip('Sunflowers', 20)).toBe('Sunflowers')
    })

    it('cuts long text and trailing space', () => {
      expect(TextFormat.clip('Wheat Field with Cypresses', 12)).toBe('Wheat Field')
    })

    it('never splits a surrogate pair', () => {
      expect(TextFormat.clip('ab\u{1D49C}', 3)).toBe('ab')
    })
  })
})
