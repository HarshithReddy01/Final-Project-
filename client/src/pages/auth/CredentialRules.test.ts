import { describe, expect, it } from 'vitest'
import { CredentialRules } from './CredentialRules.ts'

describe('CredentialRules', () => {
  it('only asks for both values when signing in', () => {
    expect(CredentialRules.check('sign-in', { username: '  ', password: '' })).toEqual({
      username: 'Enter your username.',
      password: 'Enter your password.',
    })
    expect(CredentialRules.check('sign-in', { username: 'ab', password: 'x' })).toEqual({})
  })

  it.each([
    ['', 'Enter a username.'],
    ['ab', 'Use at least 3 characters.'],
    ['a'.repeat(33), 'Use at most 32 characters.'],
    ['ada lovelace', 'Use letters, numbers, dots, dashes or underscores.'],
  ])('rejects the new username %j', (username, message) => {
    expect(CredentialRules.check('register', { username, password: 'correct horse' }).username).toBe(message)
  })

  it.each([
    ['', 'Enter a password.'],
    ['seven77', 'Use at least 8 characters.'],
    ['é'.repeat(37), 'Use at most 72 bytes.'],
  ])('rejects the new password %j', (password, message) => {
    expect(CredentialRules.check('register', { username: 'ada', password }).password).toBe(message)
  })

  it('accepts a valid registration, trimming the username', () => {
    const errors = CredentialRules.check('register', { username: '  ada.lovelace ', password: 'é'.repeat(36) })

    expect(errors).toEqual({})
    expect(CredentialRules.hasProblems(errors)).toBe(false)
  })
})
