import { describe, expect, it } from 'vitest'
import { Favorite } from './Favorite.ts'
import { FavoriteCollection } from './FavoriteCollection.ts'

function favorite(objectId: number, title: string, artist: string, savedOn: string, note = ''): Favorite {
  const createdAt = new Date(`${savedOn}T12:00:00.000Z`)
  return new Favorite({
    objectId,
    title,
    artist,
    date: '',
    medium: '',
    department: '',
    imageUrl: null,
    note,
    createdAt,
    updatedAt: createdAt,
  })
}

const wave = favorite(39799, 'The Great Wave', 'Katsushika Hokusai', '2026-11-03')
const study10 = favorite(2, 'Study 10', 'anonymous', '2026-11-01', 'Charcoal, quick.')
const study2 = favorite(3, 'study 2', 'Anonymous', '2026-11-02')
const untitled = favorite(4, 'Untitled', '', '2026-10-30')

const collection = new FavoriteCollection([wave, study2, study10, untitled])

function ids(items: FavoriteCollection): number[] {
  return items.toArray().map((item) => item.objectId)
}

describe('FavoriteCollection', () => {
  it('looks favorites up by object id', () => {
    expect(collection.size).toBe(4)
    expect(collection.isEmpty).toBe(false)
    expect(collection.has(39799)).toBe(true)
    expect(collection.has(1)).toBe(false)
    expect(collection.get(39799)).toBe(wave)
    expect(collection.get(1)).toBeNull()
    expect(FavoriteCollection.empty.isEmpty).toBe(true)
  })

  it('keeps the first of duplicate ids', () => {
    const duplicate = favorite(39799, 'Copy', 'Someone', '2026-11-05')

    expect(ids(new FavoriteCollection([wave, duplicate]))).toEqual([39799])
    expect(new FavoriteCollection([wave, duplicate]).get(39799)).toBe(wave)
  })

  describe('upsert', () => {
    it('puts a new favorite first', () => {
      const added = favorite(5, 'Sunflowers', 'Vincent van Gogh', '2026-11-06')

      expect(ids(collection.upsert(added))).toEqual([5, 39799, 3, 2, 4])
      expect(collection.size).toBe(4)
    })

    it('replaces an existing favorite where it stands', () => {
      const edited = study2.withNote('Red chalk.')
      const next = collection.upsert(edited)

      expect(ids(next)).toEqual([39799, 3, 2, 4])
      expect(next.get(3)?.note).toBe('Red chalk.')
      expect(collection.get(3)?.note).toBe('')
    })
  })

  describe('remove', () => {
    it('drops the favorite from a copy', () => {
      expect(ids(collection.remove(3))).toEqual([39799, 2, 4])
      expect(collection.has(3)).toBe(true)
    })

    it('returns the same collection when the id is unknown', () => {
      expect(collection.remove(1)).toBe(collection)
    })
  })

  describe('filter', () => {
    it('keeps favorites that match the term', () => {
      expect(ids(collection.filter('study'))).toEqual([3, 2])
      expect(ids(collection.filter('charcoal'))).toEqual([2])
      expect(collection.filter('nothing here').isEmpty).toBe(true)
    })

    it('returns the same collection for a blank term', () => {
      expect(collection.filter('  ')).toBe(collection)
    })
  })

  describe('sort', () => {
    it('orders by save date', () => {
      expect(ids(collection.sort('recent'))).toEqual([39799, 3, 2, 4])
      expect(ids(collection.sort('oldest'))).toEqual([4, 2, 3, 39799])
    })

    it('orders titles naturally without regard to case', () => {
      expect(ids(collection.sort('title'))).toEqual([3, 2, 39799, 4])
    })

    it('orders by artist, then title, with unknown artists last', () => {
      expect(ids(collection.sort('artist'))).toEqual([3, 2, 39799, 4])
    })

    it('leaves the original order untouched', () => {
      collection.sort('title')

      expect(ids(collection)).toEqual([39799, 3, 2, 4])
    })
  })

  it('offers labelled sort orders and parses them', () => {
    expect(FavoriteCollection.sortOrders.map((order) => [order.key, order.label])).toEqual([
      ['recent', 'Recently saved'],
      ['oldest', 'Oldest first'],
      ['title', 'Title'],
      ['artist', 'Artist'],
    ])
    expect(FavoriteCollection.parseSortOrder('title')).toBe('title')
    expect(FavoriteCollection.parseSortOrder('price')).toBe('recent')
    expect(FavoriteCollection.parseSortOrder(null)).toBe('recent')
  })
})
