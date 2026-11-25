import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpClient } from '../http/HttpClient.ts'
import { MetMuseumClient } from './MetMuseumClient.ts'
import { MetObjectFixture } from './MetObjectFixture.ts'
import { SearchQuery } from './SearchQuery.ts'

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('MetMuseumClient', () => {
  const client = new MetMuseumClient(new HttpClient(MetMuseumClient.baseUrl, { credentials: 'omit' }))

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('searches the paginated v1.1 endpoint', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => json(200, { total: 153, objectIDs: [436524] }))
    vi.stubGlobal('fetch', fetchMock)

    const page = await client.search(SearchQuery.empty.with({ text: 'sunflowers' }), { offset: 24, limit: 24 })

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.origin + url.pathname).toBe(`${MetMuseumClient.baseUrl}/v1.1/search`)
    expect(Object.fromEntries(url.searchParams)).toEqual({ hasImages: 'true', q: 'sunflowers', offset: '24', limit: '24' })
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe('omit')
    expect(page.total).toBe(153)
    expect(page.objectIds).toEqual([436524])
  })

  it('reads an object into an artwork', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => json(200, MetObjectFixture.build())))

    const artwork = await client.getArtwork(436524)

    expect(artwork.title).toBe('Sunflowers')
  })

  it('reports missing objects as not found', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => json(404, { message: 'ObjectID not found' })))

    await expect(client.getArtwork(1)).rejects.toMatchObject({ isNotFound: true })
  })

  it('sorts departments by name, ignoring a leading article', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        json(200, {
          departments: [
            { departmentId: 21, displayName: 'Modern Art' },
            { departmentId: 7, displayName: 'The Cloisters' },
            { departmentId: 1, displayName: 'American Decorative Arts' },
          ],
        }),
      ),
    )

    const departments = await client.getDepartments()

    expect(departments.map((department) => department.name)).toEqual([
      'American Decorative Arts',
      'The Cloisters',
      'Modern Art',
    ])
  })
})
