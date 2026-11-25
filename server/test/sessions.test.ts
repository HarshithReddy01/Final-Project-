import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TestApp } from './support/TestApp.ts'

const clearedCookie = 'vitrine_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'

describe('sessions', () => {
  let app: TestApp

  beforeEach(() => {
    app = new TestApp()
  })

  afterEach(() => {
    app.close()
  })

  it('reports no user to an anonymous visitor and leaves cookies alone', async () => {
    const response = await app.request().get('/api/auth/session')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ user: null })
    expect(response.get('Set-Cookie')).toBeUndefined()
  })

  it('returns the signed-in user', async () => {
    const ada = await app.signUp('ada')

    const response = await ada.get('/api/auth/session')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      user: { id: expect.any(Number), username: 'ada', createdAt: app.clock.now().toISOString() },
    })
  })

  it('ends the session on logout and rejects the old token afterwards', async () => {
    const token = TestApp.sessionToken(await app.register('ada'))
    const cookie = `vitrine_session=${token}`

    const logout = await app.request().post('/api/auth/logout').set('Cookie', cookie)
    const session = await app.request().get('/api/auth/session').set('Cookie', cookie)
    const favorites = await app.request().get('/api/favorites').set('Cookie', cookie)

    expect(logout.status).toBe(204)
    expect(TestApp.sessionCookie(logout)).toBe(clearedCookie)
    expect(session.body).toEqual({ user: null })
    expect(TestApp.sessionCookie(session)).toBe(clearedCookie)
    expect(favorites.status).toBe(401)
  })

  it('signs the browser out through the cleared cookie', async () => {
    const ada = await app.signUp('ada')

    await ada.post('/api/auth/logout')
    const response = await ada.get('/api/auth/session')

    expect(response.body).toEqual({ user: null })
    expect(response.get('Set-Cookie')).toBeUndefined()
  })

  it('accepts a logout without a session', async () => {
    const response = await app.request().post('/api/auth/logout')

    expect(response.status).toBe(204)
    expect(response.get('Set-Cookie')).toBeUndefined()
  })

  it('clears a cookie that matches no session', async () => {
    const response = await app.request().get('/api/auth/session').set('Cookie', 'vitrine_session=forged')

    expect(response.body).toEqual({ user: null })
    expect(TestApp.sessionCookie(response)).toBe(clearedCookie)
  })

  it('keeps a session alive until its lifetime ends', async () => {
    const ada = await app.signUp('ada')

    app.clock.advance(app.config.sessionTtlMs - 1)
    const lastMoment = await ada.get('/api/auth/session')
    app.clock.advance(1)
    const expired = await ada.get('/api/auth/session')

    expect(lastMoment.body.user.username).toBe('ada')
    expect(expired.body).toEqual({ user: null })
    expect(TestApp.sessionCookie(expired)).toBe(clearedCookie)
  })

  it('purges expired sessions when a new session starts', async () => {
    await app.register('ada')
    app.clock.advance(app.config.sessionTtlMs)
    await app.register('grace')

    const sessions = app.database
      .prepare<[], { username: string }>(
        'SELECT users.username FROM sessions JOIN users ON users.id = sessions.user_id',
      )
      .all()

    expect(sessions).toEqual([{ username: 'grace' }])
  })

  it('stores only a SHA-256 hash of the session token', async () => {
    const token = TestApp.sessionToken(await app.register('ada'))

    const stored = app.database.prepare<[], { token_hash: string }>('SELECT token_hash FROM sessions').all()

    expect(stored).toEqual([{ token_hash: createHash('sha256').update(token).digest('hex') }])
  })
})
