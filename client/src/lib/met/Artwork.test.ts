import { describe, expect, it } from 'vitest'
import { Artwork } from './Artwork.ts'
import { MetObjectFixture } from './MetObjectFixture.ts'

describe('Artwork', () => {
  describe('fromDto', () => {
    it('maps a complete record', () => {
      const artwork = Artwork.fromDto(MetObjectFixture.build())

      expect(artwork).toMatchObject({
        id: 436524,
        title: 'Sunflowers',
        maker: 'Vincent van Gogh',
        makerBio: 'Dutch, Zundert 1853–1890 Auvers-sur-Oise',
        date: '1887',
        medium: 'Oil on canvas',
        department: 'European Paintings',
        classification: 'Paintings',
        accessionNumber: '49.41',
        galleryNumber: '825',
        isHighlight: false,
        isPublicDomain: true,
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/436524',
      })
      expect(artwork.subjects).toEqual(['Sunflowers', 'Still Life'])
      expect(artwork.isOnView).toBe(true)
    })

    it('falls back to the object name, then Untitled, for an empty title', () => {
      expect(Artwork.fromDto(MetObjectFixture.build({ title: '' })).title).toBe('Painting')
      expect(Artwork.fromDto(MetObjectFixture.build({ title: ' ', objectName: '' })).title).toBe('Untitled')
    })

    it('falls back to the culture, then Unknown maker, for an empty artist', () => {
      expect(Artwork.fromDto(MetObjectFixture.build({ artistDisplayName: '', culture: 'Japan' })).maker).toBe('Japan')
      expect(Artwork.fromDto(MetObjectFixture.build({ artistDisplayName: '' })).maker).toBe('Unknown maker')
    })

    it('tolerates null arrays', () => {
      const artwork = Artwork.fromDto(
        MetObjectFixture.build({ tags: null, constituents: null, additionalImages: null, measurements: null }),
      )

      expect(artwork.subjects).toEqual([])
      expect(artwork.images).toHaveLength(1)
    })

    it('dedupes subjects regardless of case and skips empty terms', () => {
      const artwork = Artwork.fromDto(
        MetObjectFixture.build({
          tags: [
            { term: 'Cats', AAT_URL: null, Wikidata_URL: null },
            { term: ' cats ', AAT_URL: null, Wikidata_URL: null },
            { term: '', AAT_URL: null, Wikidata_URL: null },
            { term: 'Birds', AAT_URL: null, Wikidata_URL: null },
          ],
        }),
      )

      expect(artwork.subjects).toEqual(['Cats', 'Birds'])
    })

    it('trims text and normalises line breaks', () => {
      const artwork = Artwork.fromDto(MetObjectFixture.build({ dimensions: ' 10 x 12 in.\r\nFrame: 14 x 16 in. ' }))

      expect(artwork.dimensions).toBe('10 x 12 in.\nFrame: 14 x 16 in.')
    })

    it('builds the source url when the record has none', () => {
      expect(Artwork.fromDto(MetObjectFixture.build({ objectURL: '' })).sourceUrl).toBe(
        'https://www.metmuseum.org/art/collection/search/436524',
      )
    })
  })

  describe('images', () => {
    it('reports no image when the primary image is not open access', () => {
      const artwork = Artwork.fromDto(MetObjectFixture.build({ primaryImage: '', primaryImageSmall: '' }))

      expect(artwork.hasImage).toBe(false)
      expect(artwork.primaryImage).toBeNull()
      expect(artwork.images).toEqual([])
      expect(artwork.toSnapshot().imageUrl).toBeNull()
    })

    it('puts the primary image first and derives renditions for the other views', () => {
      const artwork = Artwork.fromDto(
        MetObjectFixture.build({
          additionalImages: [
            'https://images.metmuseum.org/CRDImages/ep/original/DT1.jpg',
            'https://images.metmuseum.org/CRDImages/ep/original/DP-41223-001.jpg',
            '',
          ],
        }),
      )

      expect(artwork.images.map((image) => image.displayUrl)).toEqual([
        'https://images.metmuseum.org/CRDImages/ep/web-large/DP-41223-001.jpg',
        'https://images.metmuseum.org/CRDImages/ep/web-large/DT1.jpg',
      ])
      expect(artwork.primaryImage?.fullUrl).toBe('https://images.metmuseum.org/CRDImages/ep/original/DP-41223-001.jpg')
    })

    it('derives the display rendition when only the original is listed', () => {
      const artwork = Artwork.fromDto(MetObjectFixture.build({ primaryImageSmall: '' }))

      expect(artwork.primaryImage?.displayUrl).toBe('https://images.metmuseum.org/CRDImages/ep/web-large/DP-41223-001.jpg')
    })

    it('uses the small rendition when the original is missing', () => {
      const artwork = Artwork.fromDto(MetObjectFixture.build({ primaryImage: '' }))

      expect(artwork.primaryImage?.fullUrl).toBe('https://images.metmuseum.org/CRDImages/ep/web-large/DP-41223-001.jpg')
    })
  })

  describe('facts', () => {
    it('lists the wall label in catalogue order without empty values', () => {
      expect(Artwork.fromDto(MetObjectFixture.build()).facts).toEqual([
        { label: 'Date', value: '1887', tone: 'text' },
        { label: 'Medium', value: 'Oil on canvas', tone: 'text' },
        { label: 'Dimensions', value: '17 x 24 in. (43.2 x 61 cm)', tone: 'text' },
        { label: 'Classification', value: 'Paintings', tone: 'text' },
        { label: 'Credit line', value: 'Rogers Fund, 1949', tone: 'text' },
        { label: 'Accession number', value: '49.41', tone: 'mono' },
        { label: 'Gallery', value: 'Gallery 825', tone: 'mono' },
      ])
    })

    it('includes culture, period and dynasty when present', () => {
      const labels = Artwork.fromDto(
        MetObjectFixture.build({ culture: 'China', period: 'Qing dynasty', dynasty: 'Kangxi' }),
      ).facts.map((fact) => fact.label)

      expect(labels).toEqual([
        'Date',
        'Medium',
        'Dimensions',
        'Classification',
        'Culture',
        'Period',
        'Dynasty',
        'Credit line',
        'Accession number',
        'Gallery',
      ])
    })

    it('leaves out the gallery when the work is not on view', () => {
      const artwork = Artwork.fromDto(MetObjectFixture.build({ GalleryNumber: '' }))

      expect(artwork.isOnView).toBe(false)
      expect(artwork.facts.some((fact) => fact.label === 'Gallery')).toBe(false)
    })
  })

  describe('altText', () => {
    it('names the artist, or the culture when there is none', () => {
      expect(Artwork.fromDto(MetObjectFixture.build()).altText).toBe('Sunflowers by Vincent van Gogh')
      expect(Artwork.fromDto(MetObjectFixture.build({ artistDisplayName: '', culture: 'Japan' })).altText).toBe(
        'Sunflowers, Japan',
      )
      expect(Artwork.fromDto(MetObjectFixture.build({ artistDisplayName: '' })).altText).toBe('Sunflowers')
    })
  })

  describe('toSnapshot', () => {
    it('captures what the collection page shows', () => {
      expect(Artwork.fromDto(MetObjectFixture.build()).toSnapshot()).toEqual({
        title: 'Sunflowers',
        artist: 'Vincent van Gogh',
        date: '1887',
        medium: 'Oil on canvas',
        department: 'European Paintings',
        imageUrl: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP-41223-001.jpg',
      })
    })

    it('clips values to the limits the server accepts', () => {
      const snapshot = Artwork.fromDto(
        MetObjectFixture.build({ title: 't'.repeat(600), medium: 'm'.repeat(1500), objectDate: 'd'.repeat(200) }),
      ).toSnapshot()

      expect(snapshot.title).toHaveLength(500)
      expect(snapshot.medium).toHaveLength(1000)
      expect(snapshot.date).toHaveLength(120)
    })

    it('keeps only images hosted by The Met over https', () => {
      const elsewhere = Artwork.fromDto(MetObjectFixture.build({ primaryImageSmall: 'https://example.com/a.jpg' }))
      const insecure = Artwork.fromDto(
        MetObjectFixture.build({ primaryImageSmall: 'http://images.metmuseum.org/CRDImages/ep/web-large/a.jpg' }),
      )

      expect(elsewhere.toSnapshot().imageUrl).toBeNull()
      expect(insecure.toSnapshot().imageUrl).toBeNull()
    })
  })

  describe('ids', () => {
    it('parses route parameters strictly', () => {
      expect(Artwork.parseId('436524')).toBe(436524)
      expect(Artwork.parseId('abc')).toBeNull()
      expect(Artwork.parseId('0')).toBeNull()
      expect(Artwork.parseId('007')).toBeNull()
      expect(Artwork.parseId('12.5')).toBeNull()
      expect(Artwork.parseId('2147483648')).toBeNull()
      expect(Artwork.parseId(undefined)).toBeNull()
    })

    it('validates numeric ids', () => {
      expect(Artwork.isValidId(1)).toBe(true)
      expect(Artwork.isValidId(Artwork.maxId)).toBe(true)
      expect(Artwork.isValidId(0)).toBe(false)
      expect(Artwork.isValidId(Number.NaN)).toBe(false)
      expect(Artwork.isValidId(null)).toBe(false)
    })
  })
})
