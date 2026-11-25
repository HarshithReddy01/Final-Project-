import { PositiveInteger } from '../PositiveInteger.ts'
import { TextFormat } from '../format/TextFormat.ts'
import { Pagination } from './Pagination.ts'
import { Period } from './Period.ts'
import type { PeriodKey } from './Period.ts'
import { SearchField } from './SearchField.ts'
import type { SearchFieldKey } from './SearchField.ts'

export type SearchQueryValues = {
  readonly text: string
  readonly field: SearchFieldKey
  readonly departmentId: number | null
  readonly periodKey: PeriodKey | null
  readonly highlightsOnly: boolean
  readonly onViewOnly: boolean
}

export class SearchQuery {
  static readonly maxTextLength = 200
  static readonly maxDepartmentId = 9999
  static readonly #params = {
    text: 'q',
    field: 'field',
    department: 'department',
    period: 'period',
    highlights: 'highlights',
    onView: 'onView',
  } as const
  static readonly #flag = '1'
  static readonly #whitespace = /\s+/g
  static readonly empty = new SearchQuery({
    text: '',
    field: SearchField.defaultKey,
    departmentId: null,
    periodKey: null,
    highlightsOnly: false,
    onViewOnly: false,
  })

  readonly text: string
  readonly field: SearchFieldKey
  readonly departmentId: number | null
  readonly periodKey: PeriodKey | null
  readonly highlightsOnly: boolean
  readonly onViewOnly: boolean

  constructor(values: SearchQueryValues) {
    this.text = SearchQuery.#normalizeText(values.text)
    this.field = SearchField.parse(values.field)
    this.departmentId = SearchQuery.#isDepartmentId(values.departmentId) ? values.departmentId : null
    this.periodKey = Period.find(values.periodKey)?.key ?? null
    this.highlightsOnly = values.highlightsOnly
    this.onViewOnly = values.onViewOnly
  }

  static fromSearchParams(params: URLSearchParams): SearchQuery {
    const names = SearchQuery.#params
    return new SearchQuery({
      text: params.get(names.text) ?? '',
      field: SearchField.parse(params.get(names.field)),
      departmentId: PositiveInteger.parse(params.get(names.department), SearchQuery.maxDepartmentId),
      periodKey: Period.find(params.get(names.period))?.key ?? null,
      highlightsOnly: params.get(names.highlights) === SearchQuery.#flag,
      onViewOnly: params.get(names.onView) === SearchQuery.#flag,
    })
  }

  get isBlank(): boolean {
    return this.text === '' && !this.hasFilters
  }

  get hasFilters(): boolean {
    return this.departmentId !== null || this.periodKey !== null || this.highlightsOnly || this.onViewOnly
  }

  get period(): Period | null {
    return Period.find(this.periodKey)
  }

  get cacheKey(): string {
    return this.toApiParams().toString()
  }

  with(changes: Partial<SearchQueryValues>): SearchQuery {
    return new SearchQuery({ ...this.#values(), ...changes })
  }

  equals(other: SearchQuery): boolean {
    return this.toSearchParams().toString() === other.toSearchParams().toString()
  }

  toSearchParams(page = 1): URLSearchParams {
    const names = SearchQuery.#params
    const params = new URLSearchParams()
    if (this.text !== '') params.set(names.text, this.text)
    if (this.field !== SearchField.defaultKey) params.set(names.field, this.field)
    if (this.departmentId !== null) params.set(names.department, String(this.departmentId))
    if (this.periodKey !== null) params.set(names.period, this.periodKey)
    if (this.highlightsOnly) params.set(names.highlights, SearchQuery.#flag)
    if (this.onViewOnly) params.set(names.onView, SearchQuery.#flag)
    if (page > 1) params.set(Pagination.pageParam, String(Math.floor(page)))
    return params
  }

  toApiParams(): URLSearchParams {
    const params = new URLSearchParams({ hasImages: 'true' })
    if (this.text !== '') {
      params.set('q', this.text)
      const flag = SearchField.find(this.field)?.apiFlag ?? null
      if (flag !== null) params.set(flag, 'true')
    }
    if (this.departmentId !== null) params.set('departmentId', String(this.departmentId))
    if (this.highlightsOnly || this.isBlank) params.set('isHighlight', 'true')
    if (this.onViewOnly) params.set('isOnView', 'true')
    const period = this.period
    if (period !== null) {
      params.set('dateBegin', String(period.begin))
      params.set('dateEnd', String(period.end))
    }
    return params
  }

  #values(): SearchQueryValues {
    return {
      text: this.text,
      field: this.field,
      departmentId: this.departmentId,
      periodKey: this.periodKey,
      highlightsOnly: this.highlightsOnly,
      onViewOnly: this.onViewOnly,
    }
  }

  static #normalizeText(text: string): string {
    return TextFormat.clip(text.replace(SearchQuery.#whitespace, ' ').trim(), SearchQuery.maxTextLength)
  }

  static #isDepartmentId(value: number | null): value is number {
    return value !== null && PositiveInteger.isValid(value, SearchQuery.maxDepartmentId)
  }
}
