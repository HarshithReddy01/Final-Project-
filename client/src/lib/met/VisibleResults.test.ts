import { describe, expect, it } from 'vitest'
import { ApiError } from '../http/ApiError.ts'
import { type ArtworkLoad, type ArtworkQueryState, VisibleResults } from './VisibleResults.ts'

const withImage = (id: number): ArtworkLoad => ({ id, state: 'loaded', hasImage: true })
const withoutImage = (id: number): ArtworkLoad => ({ id, state: 'loaded', hasImage: false })
const pending = (id: number): ArtworkLoad => ({ id, state: 'pending', hasImage: false })
const retrying = (id: number): ArtworkLoad => ({ id, state: 'retrying', hasImage: false })
const failed = (id: number): ArtworkLoad => ({ id, state: 'failed', hasImage: false })
const missing = (id: number): ArtworkLoad => ({ id, state: 'missing', hasImage: false })

const query = (state: Partial<ArtworkQueryState>): ArtworkQueryState => ({
  isPending: false,
  isFetched: true,
  failureCount: 0,
  error: null,
  ...state,
})

describe('VisibleResults.from', () => {
  it('shows every loaded work with an image, in search order', () => {
    const results = VisibleResults.from([withImage(1), withoutImage(2), withImage(3)], false)

    expect(results.ids).toEqual([1, 3])
    expect(results.hiddenCount).toBe(1)
    expect(results.imagelessCount).toBe(1)
    expect(results.isSettled).toBe(true)
  })

  it('keeps works without images when asked to, while still counting them', () => {
    const results = VisibleResults.from([withImage(1), withoutImage(2)], true)

    expect(results.ids).toEqual([1, 2])
    expect(results.hiddenCount).toBe(0)
    expect(results.imagelessCount).toBe(1)
  })

  it('reveals works only up to the first one still loading, so the grid never reorders', () => {
    const results = VisibleResults.from([withImage(1), pending(2), withImage(3), withoutImage(4)], false)

    expect(results.ids).toEqual([1])
    expect(results.pendingCount).toBe(2)
    expect(results.isSettled).toBe(false)
  })

  it('lets a retrying work keep its place without holding back the works after it', () => {
    const results = VisibleResults.from([retrying(1), withImage(2)], false)

    expect(results.ids).toEqual([1, 2])
    expect(results.pendingCount).toBe(0)
    expect(results.isSettled).toBe(false)
  })

  it('keeps failed works visible so their cards can offer a retry', () => {
    const results = VisibleResults.from([failed(1), withImage(2)], false)

    expect(results.ids).toEqual([1, 2])
    expect(results.isSettled).toBe(true)
  })

  it('leaves out works The Met no longer has, matching cards that render nothing for them', () => {
    const results = VisibleResults.from([withoutImage(1), missing(2)], false)

    expect(results.ids).toEqual([])
    expect(results.hiddenCount).toBe(1)
    expect(results.isEmpty).toBe(true)
  })

  it('is not empty while works are still loading', () => {
    expect(VisibleResults.from([pending(1)], false).isEmpty).toBe(false)
    expect(VisibleResults.from([], false).isEmpty).toBe(true)
  })
})

describe('VisibleResults.describe', () => {
  it('treats a query that has not answered yet as pending, or retrying after a failed attempt', () => {
    expect(VisibleResults.describe(1, undefined)).toEqual(pending(1))
    expect(VisibleResults.describe(1, query({ isPending: true, isFetched: false }))).toEqual(pending(1))
    expect(VisibleResults.describe(1, query({ isPending: true, isFetched: false, failureCount: 1 }))).toEqual(
      retrying(1),
    )
  })

  it('reads the image flag from loaded data, even while it refreshes', () => {
    expect(VisibleResults.describe(1, query({ data: { hasImage: true } }))).toEqual(withImage(1))
    expect(VisibleResults.describe(1, query({ isPending: true, data: { hasImage: false } }))).toEqual(withoutImage(1))
  })

  it('keeps a failed work failed while it is fetched again, so its card stays mounted', () => {
    const error = new ApiError(500, 'http_error', 'Server error')

    expect(VisibleResults.describe(1, query({ error }))).toEqual(failed(1))
    expect(VisibleResults.describe(1, query({ isPending: true, isFetched: true }))).toEqual(failed(1))
  })

  it('marks a work The Met cannot find as missing', () => {
    const error = new ApiError(404, 'not_found', 'ObjectID not found')

    expect(VisibleResults.describe(1, query({ error }))).toEqual(missing(1))
  })
})
