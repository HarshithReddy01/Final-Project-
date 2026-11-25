import { PositiveInteger } from '../PositiveInteger.ts'

export type PageItem = number | 'gap'

export type ResultWindow = {
  readonly offset: number
  readonly limit: number
}

export class Pagination {
  static readonly reachableResults = 10_000
  static readonly pageSize = 24
  static readonly siblingCount = 2
  static readonly pageParam = 'page'
  static readonly lastReachablePage = Math.ceil(Pagination.reachableResults / Pagination.pageSize)
  static readonly #edgeSlots = 2
  static readonly #compactLength = 2 * Pagination.siblingCount + 2 * Pagination.#edgeSlots + 1

  readonly total: number
  readonly pageCount: number
  readonly page: number

  constructor(total: number, page: number) {
    this.total = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0
    this.pageCount = Math.ceil(this.reachableTotal / Pagination.pageSize)
    this.page = Pagination.#clamp(page, Math.max(1, this.pageCount))
  }

  static window(page: number): ResultWindow {
    const offset = (Pagination.#clamp(page, Pagination.lastReachablePage) - 1) * Pagination.pageSize
    return { offset, limit: Math.min(Pagination.pageSize, Pagination.reachableResults - offset) }
  }

  static parsePage(value: string | null | undefined): number {
    return PositiveInteger.parse(value) ?? 1
  }

  static withPage(params: URLSearchParams, page: number): URLSearchParams {
    const next = new URLSearchParams(params)
    if (page > 1) next.set(Pagination.pageParam, String(Math.floor(page)))
    else next.delete(Pagination.pageParam)
    return next
  }

  get reachableTotal(): number {
    return Math.min(this.total, Pagination.reachableResults)
  }

  get hasPrevious(): boolean {
    return this.page > 1
  }

  get hasNext(): boolean {
    return this.page < this.pageCount
  }

  get isTruncated(): boolean {
    return this.total > Pagination.reachableResults
  }

  get firstItem(): number {
    return this.pageCount === 0 ? 0 : (this.page - 1) * Pagination.pageSize + 1
  }

  get lastItem(): number {
    return Math.min(this.page * Pagination.pageSize, this.reachableTotal)
  }

  visiblePages(): readonly PageItem[] {
    const count = this.pageCount
    if (count <= Pagination.#compactLength) return Pagination.#range(1, count)
    const edge = Pagination.#edgeSlots
    const span = 2 * Pagination.siblingCount
    const first = Math.min(Math.max(this.page - Pagination.siblingCount, edge + 1), count - edge - span)
    const last = first + span
    return [
      1,
      first > edge + 1 ? 'gap' : 2,
      ...Pagination.#range(first, last),
      last < count - edge ? 'gap' : count - 1,
      count,
    ]
  }

  static #clamp(page: number, max: number): number {
    if (!Number.isFinite(page)) return 1
    return Math.min(Math.max(1, Math.floor(page)), max)
  }

  static #range(from: number, to: number): number[] {
    return Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index)
  }
}
