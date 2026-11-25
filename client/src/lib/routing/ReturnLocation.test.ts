import { describe, expect, it } from 'vitest'
import { ReturnLocation } from './ReturnLocation.ts'

describe('ReturnLocation', () => {
  it('round-trips through router state', () => {
    const origin = new ReturnLocation('/?q=cat', 'Back to results')

    expect(ReturnLocation.fromState(origin.toState())).toEqual(origin)
  })

  it('ignores state it did not write', () => {
    expect(ReturnLocation.fromState(null)).toBeNull()
    expect(ReturnLocation.fromState('Back')).toBeNull()
    expect(ReturnLocation.fromState({ from: '/collection' })).toBeNull()
    expect(ReturnLocation.fromState({ from: 'https://evil.example', label: 'Back' })).toBeNull()
    expect(ReturnLocation.fromState({ from: '/collection', label: '   ' })).toBeNull()
  })
})
