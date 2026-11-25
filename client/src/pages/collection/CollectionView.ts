import { FavoriteCollection, type FavoriteSortOrder } from '../../lib/vitrine/FavoriteCollection.ts'

export type CollectionViewChanges = {
  readonly filter?: string
  readonly order?: FavoriteSortOrder
}

export class CollectionView {
  static readonly filterParam = 'filter'
  static readonly sortParam = 'sort'
  static readonly #defaultOrder = FavoriteCollection.parseSortOrder(null)

  readonly filter: string
  readonly order: FavoriteSortOrder

  constructor(params: URLSearchParams) {
    this.filter = params.get(CollectionView.filterParam) ?? ''
    this.order = FavoriteCollection.parseSortOrder(params.get(CollectionView.sortParam))
  }

  apply(collection: FavoriteCollection): FavoriteCollection {
    return collection.filter(this.filter).sort(this.order)
  }

  toSearchParams({ filter = this.filter, order = this.order }: CollectionViewChanges): URLSearchParams {
    const params = new URLSearchParams()
    if (filter.trim() !== '') params.set(CollectionView.filterParam, filter)
    if (order !== CollectionView.#defaultOrder) params.set(CollectionView.sortParam, order)
    return params
  }
}
