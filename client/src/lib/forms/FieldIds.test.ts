import { describe, expect, it } from 'vitest'
import { FieldIds } from './FieldIds.ts'

describe('FieldIds', () => {
  const ids = new FieldIds('username')

  it('derives the message ids from the control id', () => {
    expect(ids.hint).toBe('username-hint')
    expect(ids.error).toBe('username-error')
  })

  it('describes the control with the messages that are shown, error first', () => {
    expect(ids.describedBy({})).toBeUndefined()
    expect(ids.describedBy({ hint: '8 or more characters.' })).toBe('username-hint')
    expect(ids.describedBy({ hint: '8 or more characters.', error: 'Use at least 8 characters.' })).toBe(
      'username-error username-hint',
    )
    expect(ids.describedBy({ error: null }, 'username-help')).toBe('username-help')
    expect(ids.describedBy({ error: 'Enter your username.' }, 'username-help')).toBe('username-help username-error')
  })
})
