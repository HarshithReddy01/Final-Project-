import { describe, expect, it } from 'vitest'
import { Pagination } from './Pagination.ts'

describe('Pagination', () => {
  describe('window', () => {
    it('maps pages to offsets of one page size', () => {
      expect(Pagination.window(1)).toEqual({ offset: 0, limit: 24 })
      expect(Pagination.window(3)).toEqual({ offset: 48, limit: 24 })
    })

    it('never asks for more than the first 10,000 results', () => {
      expect(Pagination.lastReachablePage).toBe(417)
      expect(Pagination.window(417)).toEqual({ offset: 9984, limit: 16 })
      expect(Pagination.window(9999)).toEqual({ offset: 9984, limit: 16 })
    })

    it('treats pages below one or that are not numbers as the first', () => {
      expect(Pagination.window(0)).toEqual({ offset: 0, limit: 24 })
      expect(Pagination.window(-5)).toEqual({ offset: 0, limit: 24 })
      expect(Pagination.window(Number.NaN)).toEqual({ offset: 0, limit: 24 })
    })
  })

  describe('instance', () => {
    it('describes a page within the results', () => {
      const pagination = new Pagination(1423, 2)

      expect(pagination.pageCount).toBe(60)
      expect(pagination.page).toBe(2)
      expect(pagination.hasPrevious).toBe(true)
      expect(pagination.hasNext).toBe(true)
      expect(pagination.firstItem).toBe(25)
      expect(pagination.lastItem).toBe(48)
      expect(pagination.isTruncated).toBe(false)
    })

    it('caps everything at the 10,000 reachable results', () => {
      const pagination = new Pagination(25_000, 500)

      expect(pagination.isTruncated).toBe(true)
      expect(pagination.reachableTotal).toBe(10_000)
      expect(pagination.pageCount).toBe(417)
      expect(pagination.page).toBe(417)
      expect(pagination.hasNext).toBe(false)
      expect(pagination.firstItem).toBe(9985)
      expect(pagination.lastItem).toBe(10_000)
    })

    it('handles a search without results', () => {
      const pagination = new Pagination(0, 3)

      expect(pagination.pageCount).toBe(0)
      expect(pagination.page).toBe(1)
      expect(pagination.hasPrevious).toBe(false)
      expect(pagination.hasNext).toBe(false)
      expect(pagination.firstItem).toBe(0)
      expect(pagination.lastItem).toBe(0)
      expect(pagination.visiblePages()).toEqual([])
    })

    it('clamps the page into the available range', () => {
      expect(new Pagination(50, 9).page).toBe(3)
      expect(new Pagination(50, 0).page).toBe(1)
      expect(new Pagination(50, 2.7).page).toBe(2)
    })

    it('ends the last page on the last result', () => {
      expect(new Pagination(50, 3).lastItem).toBe(50)
    })
  })

  describe('visiblePages', () => {
    it('lists every page when they all fit', () => {
      expect(new Pagination(24 * 9, 5).visiblePages()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
      expect(new Pagination(10, 1).visiblePages()).toEqual([1])
    })

    it('compacts long ranges around the current page', () => {
      expect(new Pagination(1423, 6).visiblePages()).toEqual([1, 'gap', 4, 5, 6, 7, 8, 'gap', 60])
    })

    it('keeps the same length near either end', () => {
      expect(new Pagination(1423, 1).visiblePages()).toEqual([1, 2, 3, 4, 5, 6, 7, 'gap', 60])
      expect(new Pagination(1423, 5).visiblePages()).toEqual([1, 2, 3, 4, 5, 6, 7, 'gap', 60])
      expect(new Pagination(1423, 55).visiblePages()).toEqual([1, 'gap', 53, 54, 55, 56, 57, 'gap', 60])
      expect(new Pagination(1423, 56).visiblePages()).toEqual([1, 'gap', 54, 55, 56, 57, 58, 59, 60])
      expect(new Pagination(1423, 60).visiblePages()).toEqual([1, 'gap', 54, 55, 56, 57, 58, 59, 60])
    })

    it('shows a single hidden page instead of a gap', () => {
      expect(new Pagination(24 * 10, 6).visiblePages()).toEqual([1, 'gap', 4, 5, 6, 7, 8, 9, 10])
    })
  })

  describe('url helpers', () => {
    it('parses the page parameter leniently', () => {
      expect(Pagination.parsePage('4')).toBe(4)
      expect(Pagination.parsePage(null)).toBe(1)
      expect(Pagination.parsePage('0')).toBe(1)
      expect(Pagination.parsePage('two')).toBe(1)
      expect(Pagination.parsePage('9999')).toBe(9999)
    })

    it('sets the page while keeping the other parameters', () => {
      const params = new URLSearchParams('q=cat&page=3')

      expect(Pagination.withPage(params, 5).toString()).toBe('q=cat&page=5')
      expect(Pagination.withPage(params, 1).toString()).toBe('q=cat')
      expect(params.toString()).toBe('q=cat&page=3')
    })
  })
})
