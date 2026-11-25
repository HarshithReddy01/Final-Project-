import { describe, expect, it } from 'vitest'
import { Period } from './Period.ts'

describe('Period', () => {
  it('offers the presets in chronological order', () => {
    expect(Period.all.map((period) => period.key)).toEqual([
      'before-500',
      '500-1400',
      '1400-1600',
      '1600-1800',
      '1800-1900',
      '1900-present',
    ])
  })

  it('labels the presets for people', () => {
    expect(Period.all.map((period) => period.label)).toEqual([
      'Before 500',
      '500–1400',
      '1400–1600',
      '1600–1800',
      '1800–1900',
      '1900–present',
    ])
  })

  it('reaches back before the common era', () => {
    expect(Period.find('before-500')).toMatchObject({ begin: -10_000, end: 499 })
  })

  it('ends the open range in the current year', () => {
    expect(Period.find('1900-present')?.end).toBe(new Date().getFullYear())
  })

  it('joins adjacent presets without overlap', () => {
    Period.all.slice(1).forEach((period, index) => {
      expect(period.begin).toBe((Period.all[index]?.end ?? Number.NaN) + 1)
    })
  })

  it('returns null for unknown keys', () => {
    expect(Period.find('jurassic')).toBeNull()
    expect(Period.find(null)).toBeNull()
    expect(Period.find(undefined)).toBeNull()
  })
})
