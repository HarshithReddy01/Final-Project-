import { describe, expect, it } from 'vitest'
import { Favorite } from './Favorite.ts'
import type { FavoriteDto } from './dto.ts'

const dto: FavoriteDto = {
  objectId: 436535,
  title: 'Wheat Field with Cypresses',
  artist: 'Vincent van Gogh',
  date: '1889',
  medium: 'Oil on canvas',
  department: 'European Paintings',
  imageUrl: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP-42549-001.jpg',
  note: 'The cypress is almost black.',
  createdAt: '2026-11-03T12:00:00.000Z',
  updatedAt: '2026-11-04T08:30:00.000Z',
}

describe('Favorite', () => {
  it('reads a favorite from the API', () => {
    const favorite = Favorite.fromDto(dto)

    expect(favorite.objectId).toBe(436535)
    expect(favorite.title).toBe('Wheat Field with Cypresses')
    expect(favorite.createdAt.toISOString()).toBe('2026-11-03T12:00:00.000Z')
    expect(favorite.updatedAt.toISOString()).toBe('2026-11-04T08:30:00.000Z')
    expect(favorite.hasNote).toBe(true)
  })

  it('drafts an unsaved favorite from a snapshot', () => {
    const now = new Date('2026-11-25T09:00:00.000Z')
    const favorite = Favorite.draft(
      39799,
      { title: 'The Great Wave', artist: 'Katsushika Hokusai', date: 'ca. 1830–32', medium: '', department: '', imageUrl: null },
      now,
    )

    expect(favorite.objectId).toBe(39799)
    expect(favorite.note).toBe('')
    expect(favorite.hasNote).toBe(false)
    expect(favorite.createdAt).toBe(now)
    expect(favorite.updatedAt).toBe(now)
  })

  it('replaces the note on a copy', () => {
    const favorite = Favorite.fromDto(dto)
    const edited = favorite.withNote('  Seen in gallery 822.  ')

    expect(edited).not.toBe(favorite)
    expect(edited.note).toBe('Seen in gallery 822.')
    expect(edited.title).toBe(favorite.title)
    expect(favorite.note).toBe('The cypress is almost black.')
    expect(favorite.withNote('   ').hasNote).toBe(false)
  })

  describe('matches', () => {
    const favorite = Favorite.fromDto({ ...dto, artist: 'Paul Gauguin', title: 'Ia Orana Maria (Hail Mary)' })

    it('matches the title, artist or note without regard to case', () => {
      expect(favorite.matches('ORANA')).toBe(true)
      expect(favorite.matches('gauguin')).toBe(true)
      expect(favorite.matches('cypress')).toBe(true)
      expect(favorite.matches('sunflowers')).toBe(false)
    })

    it('ignores accents on either side', () => {
      expect(favorite.matches('gaugúin')).toBe(true)
      expect(Favorite.fromDto({ ...dto, artist: 'Édouard Manet' }).matches('edouard')).toBe(true)
    })

    it('requires every word to appear', () => {
      expect(favorite.matches('gauguin mary')).toBe(true)
      expect(favorite.matches('gauguin sunflowers')).toBe(false)
    })

    it('does not match across fields', () => {
      expect(Favorite.fromDto({ ...dto, title: 'Sun', artist: 'flowers', note: '' }).matches('sunflowers')).toBe(false)
    })

    it('matches everything for a blank term', () => {
      expect(favorite.matches('')).toBe(true)
      expect(favorite.matches('   ')).toBe(true)
    })
  })
})
