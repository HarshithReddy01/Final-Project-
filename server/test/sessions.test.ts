import { createHash, randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TestApp } from './support/TestApp.ts'

describe('sessions', () => {
  let app: TestApp

  beforeEach(async () => {
    app = await TestApp.create()
  })

  afterEach(() => {
    app.close()
  })

  it('reports no user to an anonymous visitor', async () => {
    const response = await app.request().get('/api/auth/session')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ user: null })
  })

  it('returns the user behind a bearer token', async () => {
    const ada = await app.signUp('ada')

    const response = await ada.get('/api/auth/session')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      user: { id: expect.any(Number), username: 'ada', createdAt: app.clock.now().toISOString() },
    })
  })

  it('accepts the bearer scheme in any letter case', async () => {
    const ada = await app.signUp('ada')

    const response = await app.request().get('/api/auth/session').set('Authorization', `bearer ${ada.token}`)

    expect(response.body.user.username).toBe('ada')
  })

  it.each([
    'Basic YWRhOnNlY3JldA==',
    'Bearer',
    'Bearer not a token',
    `Bearer ${'x'.repeat(300)}`,
    `Bearer ${randomBytes(32).toString('base64url')}`,
  ])('treats the Authorization header %s as anonymous', async (header) => {
    const response = await app.request().get('/api/auth/session').set('Authorization', header)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ user: null })
  })

  it('ends the session on logout and rejects the token afterwards', async () => {
    const ada = await app.signUp('ada')

    const logout = await ada.post('/api/auth/logout')
    const session = await ada.get('/api/auth/session')
    const favorites = await ada.get('/api/favorites')

    expect(logout.status).toBe(204)
    expect(session.body).toEqual({ user: null })
    expect(favorites.status).toBe(401)
    expect(favorites.get('WWW-Authenticate')).toBe('Bearer')
  })

  it('only ends the session that signed out', async () => {
    const laptop = await app.signUp('ada')
    const phone = app.as(TestApp.sessionToken(await app.login('ada')))

    await laptop.post('/api/auth/logout')
    const response = await phone.get('/api/auth/session')

    expect(response.body.user.username).toBe('ada')
  })

  it('accepts a logout without a token', async () => {
    const response = await app.request().post('/api/auth/logout')

    expect(response.status).toBe(204)
  })

  it('keeps a session alive until its lifetime ends', async () => {
    const ada = await app.signUp('ada')

    app.clock.advance(app.config.sessionTtlMs - 1)
    const lastMoment = await ada.get('/api/auth/session')
    app.clock.advance(1)
    const expired = await ada.get('/api/auth/session')

    expect(lastMoment.body.user.username).toBe('ada')
    expect(expired.body).toEqual({ user: null })
  })

  it('purges expired sessions when a new session starts', async () => {
    await app.register('ada')
    app.clock.advance(app.config.sessionTtlMs)
    await app.register('grace')

    const owners = await app.database.rows(
      { sql: 'SELECT users.username FROM sessions JOIN users ON users.id = sessions.user_id' },
      (row) => row.text('username'),
    )

    expect(owners).toEqual(['grace'])
  })

  it('stores only a SHA-256 hash of the session token', async () => {
    const token = TestApp.sessionToken(await app.register('ada'))

    const stored = await app.database.rows({ sql: 'SELECT token_hash FROM sessions' }, (row) =>
      row.text('token_hash'),
    )

    expect(stored).toEqual([createHash('sha256').update(token).digest('hex')])
  })
})
