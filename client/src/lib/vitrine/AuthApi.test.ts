import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpClient } from '../http/HttpClient.ts'
import { AuthApi } from './AuthApi.ts'
import { SessionTokenStore } from './SessionTokenStore.ts'

const userDto = { id: 7, username: 'ada', createdAt: '2026-11-25T12:00:00.000Z' }

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function setUp(token: string | null = null) {
  const tokens = new SessionTokenStore(null)
  if (token !== null) tokens.save(token)
  const api = new AuthApi(new HttpClient('/api', { credentials: 'omit', tokens }), tokens)
  return { api, tokens }
}

describe('AuthApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('answers signed out without calling the server when no token is stored', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    const { api } = setUp()

    await expect(api.getSession()).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('asks the server about a stored token and returns the user', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => json(200, { user: userDto }))
    vi.stubGlobal('fetch', fetchMock)
    const { api } = setUp('stored-token')

    const user = await api.getSession()

    expect(user?.username).toBe('ada')
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({ Authorization: 'Bearer stored-token' })
  })

  it('forgets a token the server no longer recognises', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => json(200, { user: null })))
    const { api, tokens } = setUp('expired-token')

    await expect(api.getSession()).resolves.toBeNull()
    expect(tokens.token).toBeNull()
  })

  it('stores the session token from a successful sign-in', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        json(200, { user: userDto, session: { token: 'new-token', expiresAt: '2026-12-09T12:00:00.000Z' } }),
      ),
    )
    const { api, tokens } = setUp()

    const user = await api.signIn({ username: 'ada', password: 'correct horse' })

    expect(user.username).toBe('ada')
    expect(tokens.token).toBe('new-token')
  })

  it('keeps no token when registration fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        json(409, { error: { code: 'username_taken', message: 'That username is taken.' } }),
      ),
    )
    const { api, tokens } = setUp()

    await expect(api.register({ username: 'ada', password: 'correct horse' })).rejects.toMatchObject({
      code: 'username_taken',
    })
    expect(tokens.token).toBeNull()
  })

  it('clears the token on sign-out even when the server cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )
    const { api, tokens } = setUp('stored-token')

    await expect(api.signOut()).rejects.toMatchObject({ code: 'network_error' })
    expect(tokens.token).toBeNull()
  })
})
