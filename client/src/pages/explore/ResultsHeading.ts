import { TextFormat } from '../../lib/format/TextFormat.ts'
import { Pagination } from '../../lib/met/Pagination.ts'
import type { SearchQuery } from '../../lib/met/SearchQuery.ts'

export class ResultsHeading {
  static title(query: SearchQuery): string {
    if (query.isBlank) return 'Highlights'
    if (query.text !== '') return `Results for “${query.text}”`
    return 'Filtered works'
  }

  static backLabel(query: SearchQuery): string {
    return query.isBlank ? 'Back to highlights' : 'Back to results'
  }

  static meta(pagination: Pagination): string {
    const parts = [
      TextFormat.count(pagination.total, 'work', 'works'),
      `Page ${TextFormat.number(pagination.page)} of ${TextFormat.number(pagination.pageCount)}`,
    ]
    if (pagination.isTruncated) parts.push(`Showing the first ${TextFormat.number(Pagination.reachableResults)}`)
    return parts.join(' · ')
  }
}
