import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { HttpServer } from '../src/HttpServer.ts'
import { Logger } from '../src/shared/Logger.ts'
import { TestApp } from './support/TestApp.ts'

describe('HTTP surface', () => {
  let app: TestApp

  beforeEach(() => {
    app = new TestApp()
  })

  afterEach(() => {
    app.close()
  })

  it('reports health', async () => {
    const response = await app.request().get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  it('sends the content security policy and hides the framework', async () => {
    const response = await app.request().get('/api/health')

    expect(response.get('Content-Security-Policy')).toBe(
      "default-src 'self';img-src 'self' data: https://images.metmuseum.org;" +
        "connect-src 'self' https://collectionapi.metmuseum.org;font-src 'self' data:;" +
        "style-src 'self' 'unsafe-inline';script-src 'self';object-src 'none';base-uri 'self';" +
        "frame-ancestors 'none';form-action 'self'",
    )
    expect(response.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.get('X-Powered-By')).toBeUndefined()
  })

  it.each([
    ['get', '/api/artworks'],
    ['post', '/api/auth/password-reset'],
    ['get', '/api/favorites/436524/notes'],
  ] as const)('answers %s %s with not_found', async (method, path) => {
    const ada = await app.signUp('ada')

    const response = await ada[method](path)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: { code: 'not_found', message: 'Not found.' } })
  })

  it('rejects malformed JSON', async () => {
    const response = await app
      .request()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"username": "ada",')

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: { code: 'invalid_json', message: 'The request body is not valid JSON.' } })
  })

  it('rejects bodies over 16kb', async () => {
    const response = await app
      .request()
      .post('/api/auth/login')
      .send({ username: 'ada', password: 'p'.repeat(16 * 1024) })

    expect(response.status).toBe(413)
    expect(response.body).toEqual({
      error: { code: 'payload_too_large', message: 'The request body is too large.' },
    })
  })
})

describe('authentication rate limit', () => {
  let app: TestApp

  beforeEach(() => {
    app = new TestApp({ authRateLimit: { windowMs: 60_000, limit: 3 } })
  })

  afterEach(() => {
    app.close()
  })

  it('stops sign-in and registration attempts past the limit', async () => {
    const allowedStatuses: number[] = []
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await app.login('ada')
      allowedStatuses.push(response.status)
    }

    const login = await app.login('ada')
    const registration = await app.register('ada')
    const session = await app.request().get('/api/auth/session')

    expect(allowedStatuses).toEqual([401, 401, 401])
    expect(login.status).toBe(429)
    expect(login.body).toEqual({
      error: { code: 'rate_limited', message: 'Too many attempts. Try again in a few minutes.' },
    })
    expect(login.get('Retry-After')).toBeDefined()
    expect(registration.status).toBe(429)
    expect(session.status).toBe(200)
  })
})

describe('unexpected failures', () => {
  it('answers with a generic 500 and logs the cause', async () => {
    const logged: unknown[][] = []
    const app = new TestApp({
      logger: new Logger({
        info: () => undefined,
        warn: () => undefined,
        error: (...entry: unknown[]) => {
          logged.push(entry)
        },
      }),
    })
    app.close()

    const response = await app.login('ada')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: { code: 'internal_error', message: 'Something went wrong on our side.' } })
    expect(logged).toHaveLength(1)
    expect(logged[0]?.[0]).toMatch(/ ERROR POST \/api\/auth\/login failed$/)
    expect(logged[0]?.[1]).toBeInstanceOf(TypeError)
  })
})

describe('HttpServer', () => {
  it('serves on the port it bound and closes the database once it has shut down', async () => {
    const app = new TestApp()
    const server = new HttpServer(app.express, app.database)

    const port = await server.listen(0)
    const response = await fetch(`http://localhost:${port}/api/health`)
    const body: unknown = await response.json()
    const closing = server.close()
    await closing

    expect(port).toBeGreaterThan(0)
    expect(body).toEqual({ status: 'ok' })
    expect(server.close()).toBe(closing)
    expect(() => app.database.prepare('SELECT 1')).toThrow(TypeError)
  })

  it('rejects when the port is already taken', async () => {
    const first = new TestApp()
    const second = new TestApp()
    const running = new HttpServer(first.express, first.database)
    const port = await running.listen(0)

    await expect(new HttpServer(second.express, second.database).listen(port)).rejects.toThrow(/EADDRINUSE/)

    await running.close()
    second.close()
  })
})
