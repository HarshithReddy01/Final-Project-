import type { QueryKey } from '@tanstack/react-query'
import type { SearchQuery } from '../lib/met/SearchQuery.ts'

export class QueryKeys {
  static readonly #vitrine = 'vitrine'
  static readonly #met = 'met'

  static readonly session = [QueryKeys.#vitrine, 'session'] as const
  static readonly favorites = [QueryKeys.#vitrine, 'favorites'] as const
  static readonly departments = [QueryKeys.#met, 'departments'] as const

  static search(query: SearchQuery, page: number) {
    return [QueryKeys.#met, 'search', query.cacheKey, page] as const
  }

  static artwork(id: number) {
    return [QueryKeys.#met, 'artwork', id] as const
  }

  static isVitrine(key: QueryKey): boolean {
    return key[0] === QueryKeys.#vitrine
  }
}
