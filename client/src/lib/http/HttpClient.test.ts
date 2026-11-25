import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './ApiError.ts'
import { HttpClient } from './HttpClient.ts'

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}

function stubFetch(respond: () => Promise<Response>) {
  const fetchMock = vi.fn<typeof fetch>(respond)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('HttpClient', () => {
  const client = new HttpClient('/api', { credentials: 'same-origin' })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests JSON from the base url with the query and credentials', async () => {
    const fetchMock = stubFetch(async () => json(200, { status: 'ok' }))

    await expect(client.get('/health', { query: new URLSearchParams({ a: '1' }) })).resolves.toEqual({ status: 'ok' })

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('/api/health?a=1')
    expect(init).toMatchObject({ method: 'GET', credentials: 'same-origin', headers: { Accept: 'application/json' } })
    expect(init?.body).toBeUndefined()
  })

  it('sends the current bearer token when one is available', async () => {
    const fetchMock = stubFetch(async () => json(200, {}))
    const source: { token: string | null } = { token: null }
    const authorized = new HttpClient('/api', { credentials: 'omit', tokens: source })

    await authorized.get('/auth/session')
    source.token = 'abc'
    await authorized.get('/auth/session')

    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({ Accept: 'application/json' })
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toEqual({ Accept: 'application/json', Authorization: 'Bearer abc' })
  })

  it('leaves the question mark off an empty query', async () => {
    const fetchMock = stubFetch(async () => json(200, {}))

    await client.get('/health', { query: new URLSearchParams() })

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/health')
  })

  it('sends bodies as JSON', async () => {
    const fetchMock = stubFetch(async () => json(200, { favorite: null }))

    await client.patch('/favorites/1', { note: 'Red chalk.' })

    const init = fetchMock.mock.calls[0]?.[1]
    expect(init?.method).toBe('PATCH')
    expect(init?.body).toBe('{"note":"Red chalk."}')
    expect(init?.headers).toEqual({ Accept: 'application/json', 'Content-Type': 'application/json' })
  })

  it('resolves to undefined for 204 responses', async () => {
    stubFetch(async () => new Response(null, { status: 204 }))

    await expect(client.post('/auth/logout')).resolves.toBeUndefined()
    await expect(client.delete('/favorites/1')).resolves.toBeUndefined()
  })

  it('turns error responses into ApiError', async () => {
    stubFetch(async () => json(401, { error: { code: 'unauthenticated', message: 'Sign in to continue.' } }))

    const error = await client.get('/favorites').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401, code: 'unauthenticated', message: 'Sign in to continue.' })
  })

  it('handles error responses without a JSON body', async () => {
    stubFetch(async () => new Response('Bad Gateway', { status: 502, headers: { 'Content-Type': 'text/plain' } }))

    await expect(client.get('/favorites')).rejects.toMatchObject({ status: 502, code: 'http_error' })
  })

  it('reports a failed connection as a network error', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    await expect(client.get('/health')).rejects.toMatchObject({ status: 0, code: 'network_error' })
  })

  it('rethrows aborts untouched', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError')
    stubFetch(async () => {
      throw abort
    })

    await expect(client.get('/health')).rejects.toBe(abort)
  })
})
