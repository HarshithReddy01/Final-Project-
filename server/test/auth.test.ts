import bcrypt from 'bcrypt'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PasswordHasher } from '../src/auth/PasswordHasher.ts'
import { TestApp } from './support/TestApp.ts'

describe('POST /api/auth/register', () => {
  let app: TestApp

  beforeEach(() => {
    app = new TestApp()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    app.close()
  })

  it('creates the account and returns the public user', async () => {
    const response = await app.register('ada')

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      user: { id: expect.any(Number), username: 'ada', createdAt: app.clock.now().toISOString() },
    })
  })

  it('starts a session with an httpOnly, same-site cookie that expires with it', async () => {
    const response = await app.register('ada')
    const expiresAt = new Date(app.clock.now().getTime() + app.config.sessionTtlMs)
    const [pair, ...attributes] = TestApp.sessionCookie(response)?.split('; ') ?? []

    expect(pair).toMatch(/^vitrine_session=[\w-]{43}$/)
    expect(attributes).toEqual(['Path=/', `Expires=${expiresAt.toUTCString()}`, 'HttpOnly', 'SameSite=Lax'])
  })

  it('trims the username before saving it', async () => {
    const response = await app.register('  ada.lovelace  ')

    expect(response.status).toBe(201)
    expect(response.body.user.username).toBe('ada.lovelace')
  })

  it('rejects a username that is taken in any letter case', async () => {
    await app.register('Ada')

    const response = await app.register('ADA')

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      error: {
        code: 'username_taken',
        message: 'That username is taken.',
        fields: { username: 'That username is taken.' },
      },
    })
    expect(TestApp.sessionCookie(response)).toBeUndefined()
  })

  it('reports username_taken when a concurrent registration claims the name first', async () => {
    vi.spyOn(PasswordHasher.prototype, 'hash').mockImplementationOnce(async (password) => {
      await app.register('ADA')
      return new PasswordHasher(app.config.bcryptRounds).hash(password)
    })

    const response = await app.register('ada')
    const users = app.database.prepare<[], { username: string }>('SELECT username FROM users').all()

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('username_taken')
    expect(users).toEqual([{ username: 'ADA' }])
  })

  it.each([
    {
      scenario: 'a username under 3 characters',
      body: { username: 'ab', password: TestApp.password },
      fields: { username: 'Use at least 3 characters.' },
    },
    {
      scenario: 'a short username with symbols, reporting the first rule it breaks',
      body: { username: 'a!', password: TestApp.password },
      fields: { username: 'Use at least 3 characters.' },
    },
    {
      scenario: 'a username over 32 characters',
      body: { username: 'a'.repeat(33), password: TestApp.password },
      fields: { username: 'Use at most 32 characters.' },
    },
    {
      scenario: 'a username with spaces inside',
      body: { username: 'ada lovelace', password: TestApp.password },
      fields: { username: 'Use letters, numbers, dots, dashes or underscores.' },
    },
    {
      scenario: 'a password under 8 characters',
      body: { username: 'ada', password: 'seven77' },
      fields: { password: 'Use at least 8 characters.' },
    },
    {
      scenario: 'missing credentials',
      body: {},
      fields: { username: 'Enter a username.', password: 'Enter a password.' },
    },
  ])('rejects $scenario', async ({ body, fields }) => {
    const response = await app.request().post('/api/auth/register').send(body)

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: { code: 'validation_failed', message: 'Some fields need attention.', fields },
    })
  })

  it('rejects a password longer than 72 bytes even when it has fewer characters', async () => {
    const password = 'é'.repeat(37)

    const response = await app.register('ada', password)

    expect(password).toHaveLength(37)
    expect(response.status).toBe(400)
    expect(response.body.error.fields).toEqual({ password: 'Use at most 72 bytes.' })
  })

  it('accepts a password of exactly 72 bytes', async () => {
    const response = await app.register('ada', 'é'.repeat(36))

    expect(response.status).toBe(201)
  })

  it('reports a body that is not an object at the root', async () => {
    const response = await app.request().post('/api/auth/register').send([])

    expect(response.status).toBe(400)
    expect(Object.keys(response.body.error.fields)).toEqual(['_'])
  })
})

describe('POST /api/auth/login', () => {
  let app: TestApp

  beforeEach(async () => {
    app = new TestApp()
    await app.register('ada')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    app.close()
  })

  it('signs in with the right password and starts a session', async () => {
    const response = await app.login('ada')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      user: { id: expect.any(Number), username: 'ada', createdAt: app.clock.now().toISOString() },
    })
    expect(TestApp.sessionCookie(response)).toMatch(/^vitrine_session=[\w-]{43}; /)
  })

  it('matches the username regardless of letter case and surrounding spaces', async () => {
    const response = await app.login(' ADA ')

    expect(response.status).toBe(200)
    expect(response.body.user.username).toBe('ada')
  })

  it('answers a wrong password and an unknown user identically', async () => {
    const wrongPassword = await app.login('ada', 'not it at all')
    const unknownUser = await app.login('grace')
    const expected = { error: { code: 'invalid_credentials', message: 'Incorrect username or password.' } }

    expect(wrongPassword.status).toBe(401)
    expect(unknownUser.status).toBe(401)
    expect(wrongPassword.body).toEqual(expected)
    expect(unknownUser.body).toEqual(expected)
    expect(TestApp.sessionCookie(wrongPassword)).toBeUndefined()
    expect(TestApp.sessionCookie(unknownUser)).toBeUndefined()
  })

  it('still compares a password hash when the username does not exist', async () => {
    const compare = vi.spyOn(bcrypt, 'compare')

    await app.login('grace')

    expect(compare).toHaveBeenCalledOnce()
  })

  it('only requires both credentials to be present', async () => {
    const response = await app.login('   ', '')

    expect(response.status).toBe(400)
    expect(response.body.error.fields).toEqual({
      username: 'Enter your username.',
      password: 'Enter your password.',
    })
  })

  it('does not apply registration rules to the password', async () => {
    const response = await app.login('ada', 'x')

    expect(response.status).toBe(401)
  })
})
