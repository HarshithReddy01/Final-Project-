import { describe, expect, it } from 'vitest'
import { SearchQuery } from './SearchQuery.ts'

function parse(search: string): SearchQuery {
  return SearchQuery.fromSearchParams(new URLSearchParams(search))
}

describe('SearchQuery', () => {
  describe('fromSearchParams', () => {
    it('reads every supported parameter', () => {
      const query = parse('q=sunflowers&field=title&department=11&period=1800-1900&highlights=1&onView=1')

      expect(query.text).toBe('sunflowers')
      expect(query.field).toBe('title')
      expect(query.departmentId).toBe(11)
      expect(query.periodKey).toBe('1800-1900')
      expect(query.highlightsOnly).toBe(true)
      expect(query.onViewOnly).toBe(true)
    })

    it('falls back to the defaults for values it does not recognise', () => {
      const query = parse('q=%20%20&field=everything&department=abc&period=jurassic&highlights=true&onView=yes')

      expect(query.equals(SearchQuery.empty)).toBe(true)
    })

    it('accepts only positive whole department ids', () => {
      expect(parse('department=0').departmentId).toBeNull()
      expect(parse('department=-3').departmentId).toBeNull()
      expect(parse('department=1.5').departmentId).toBeNull()
      expect(parse('department=011').departmentId).toBeNull()
      expect(parse('department=123456').departmentId).toBeNull()
    })

    it('collapses whitespace and caps the length of the text', () => {
      expect(parse('q=%20van%20%20%20gogh%0A').text).toBe('van gogh')
      expect(parse(`q=${'a'.repeat(500)}`).text).toHaveLength(SearchQuery.maxTextLength)
    })
  })

  describe('toSearchParams', () => {
    it('omits every default', () => {
      expect(SearchQuery.empty.toSearchParams().toString()).toBe('')
      expect(SearchQuery.empty.toSearchParams(1).toString()).toBe('')
    })

    it('round-trips through the URL', () => {
      const query = parse('q=cat&field=tags&department=11&period=before-500&highlights=1&onView=1')

      expect(SearchQuery.fromSearchParams(query.toSearchParams()).equals(query)).toBe(true)
    })

    it('writes the page only after the first', () => {
      const query = parse('q=cat')

      expect(query.toSearchParams(1).has('page')).toBe(false)
      expect(query.toSearchParams(3).get('page')).toBe('3')
    })
  })

  describe('toApiParams', () => {
    it('asks for highlights with images when the query is blank', () => {
      expect(Object.fromEntries(SearchQuery.empty.toApiParams())).toEqual({ hasImages: 'true', isHighlight: 'true' })
    })

    it('treats a search field without text as blank', () => {
      expect(parse('field=title').toApiParams().toString()).toBe(SearchQuery.empty.toApiParams().toString())
    })

    it('sends the text with the flag of its search field', () => {
      expect(Object.fromEntries(parse('q=sunflowers&field=title').toApiParams())).toEqual({
        hasImages: 'true',
        q: 'sunflowers',
        title: 'true',
      })
      expect(parse('q=japan&field=artist').toApiParams().get('artistOrCulture')).toBe('true')
      expect(parse('q=cat&field=tags').toApiParams().get('tags')).toBe('true')
      expect(parse('q=cat').toApiParams().has('title')).toBe(false)
    })

    it('maps filters without forcing highlights', () => {
      expect(Object.fromEntries(parse('department=11&period=1600-1800&onView=1').toApiParams())).toEqual({
        hasImages: 'true',
        departmentId: '11',
        isOnView: 'true',
        dateBegin: '1600',
        dateEnd: '1799',
      })
    })

    it('sends booleans only when they are true', () => {
      const params = parse('q=cat').toApiParams()

      expect(params.has('isHighlight')).toBe(false)
      expect(params.has('isOnView')).toBe(false)
      expect(parse('q=cat&highlights=1').toApiParams().get('isHighlight')).toBe('true')
    })

    it('sends negative years for periods before the common era', () => {
      const params = parse('period=before-500').toApiParams()

      expect(params.get('dateBegin')).toBe('-10000')
      expect(params.get('dateEnd')).toBe('499')
    })
  })

  describe('state', () => {
    it('tells blank, filtered and text queries apart', () => {
      expect(SearchQuery.empty.isBlank).toBe(true)
      expect(parse('field=artist').isBlank).toBe(true)
      expect(parse('highlights=1').isBlank).toBe(false)
      expect(parse('highlights=1').hasFilters).toBe(true)
      expect(parse('q=cat').isBlank).toBe(false)
      expect(parse('q=cat').hasFilters).toBe(false)
    })

    it('derives the cache key from the request it makes', () => {
      expect(parse('q=cat&department=11').cacheKey).toBe(parse('department=11&q=cat').cacheKey)
      expect(parse('field=title').cacheKey).toBe(SearchQuery.empty.cacheKey)
      expect(parse('q=cat').cacheKey).not.toBe(parse('q=dog').cacheKey)
    })

    it('exposes the selected period', () => {
      expect(parse('period=1900-present').period?.label).toBe('1900–present')
      expect(SearchQuery.empty.period).toBeNull()
    })

    it('returns new sanitised instances from with', () => {
      const query = parse('q=cat')
      const next = query.with({ departmentId: 11 })

      expect(next).not.toBe(query)
      expect(next.departmentId).toBe(11)
      expect(next.text).toBe('cat')
      expect(query.departmentId).toBeNull()
      expect(query.with({ text: '  dog  ' }).text).toBe('dog')
      expect(query.with({ departmentId: -1 }).departmentId).toBeNull()
    })
  })
})
