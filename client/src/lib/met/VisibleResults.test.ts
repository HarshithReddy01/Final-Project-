import { describe, expect, it } from 'vitest'
import { type ArtworkLoad, VisibleResults } from './VisibleResults.ts'

const withImage = (id: number): ArtworkLoad => ({ id, state: 'loaded', hasImage: true })
const withoutImage = (id: number): ArtworkLoad => ({ id, state: 'loaded', hasImage: false })
const pending = (id: number): ArtworkLoad => ({ id, state: 'pending', hasImage: false })
const failed = (id: number): ArtworkLoad => ({ id, state: 'failed', hasImage: false })

describe('VisibleResults', () => {
  it('shows every loaded work with an image, in search order', () => {
    const results = VisibleResults.from([withImage(1), withoutImage(2), withImage(3)], false)

    expect(results.ids).toEqual([1, 3])
    expect(results.hiddenCount).toBe(1)
    expect(results.isSettled).toBe(true)
  })

  it('keeps works without images when asked to', () => {
    const results = VisibleResults.from([withImage(1), withoutImage(2)], true)

    expect(results.ids).toEqual([1, 2])
    expect(results.hiddenCount).toBe(0)
  })

  it('reveals works only up to the first one still loading, so the grid never reorders', () => {
    const results = VisibleResults.from([withImage(1), pending(2), withImage(3), withoutImage(4)], false)

    expect(results.ids).toEqual([1])
    expect(results.pendingCount).toBe(2)
    expect(results.isSettled).toBe(false)
  })

  it('keeps failed works visible so their cards can offer a retry', () => {
    const results = VisibleResults.from([failed(1), withImage(2)], false)

    expect(results.ids).toEqual([1, 2])
  })

  it('is empty once every work turns out to have no image', () => {
    const results = VisibleResults.from([withoutImage(1), withoutImage(2)], false)

    expect(results.isEmpty).toBe(true)
    expect(results.hiddenCount).toBe(2)
  })

  it('is not empty while works are still loading', () => {
    expect(VisibleResults.from([pending(1)], false).isEmpty).toBe(false)
    expect(VisibleResults.from([], false).isEmpty).toBe(true)
  })

  it('describes query states as loads', () => {
    expect(VisibleResults.describe(1, undefined)).toEqual(pending(1))
    expect(VisibleResults.describe(1, { isPending: true, isError: false })).toEqual(pending(1))
    expect(VisibleResults.describe(1, { isPending: false, isError: true })).toEqual(failed(1))
    expect(VisibleResults.describe(1, { isPending: false, isError: false, data: { hasImage: true } })).toEqual(
      withImage(1),
    )
  })
})
