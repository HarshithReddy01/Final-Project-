import { describe, expect, it } from 'vitest'
import { SearchPage } from './SearchPage.ts'

describe('SearchPage', () => {
  it('reads the total and the ids', () => {
    const page = SearchPage.fromDto({ total: 153, objectIDs: [436524, 437112] })

    expect(page.total).toBe(153)
    expect(page.objectIds).toEqual([436524, 437112])
    expect(page.isEmpty).toBe(false)
  })

  it('treats null ids as an empty page', () => {
    const page = SearchPage.fromDto({ total: 0, objectIDs: null })

    expect(page.objectIds).toEqual([])
    expect(page.isEmpty).toBe(true)
  })

  it('is empty past the end even when the total is not', () => {
    expect(SearchPage.fromDto({ total: 153, objectIDs: null }).isEmpty).toBe(true)
  })

  it('drops duplicate ids so every card has its own key', () => {
    expect(SearchPage.fromDto({ total: 3, objectIDs: [1, 2, 1] }).objectIds).toEqual([1, 2])
  })
})
