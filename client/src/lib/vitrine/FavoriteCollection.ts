import type { Favorite } from './Favorite.ts'

export type FavoriteSortOrder = 'recent' | 'oldest' | 'title' | 'artist'

export type FavoriteSortOption = {
  readonly key: FavoriteSortOrder
  readonly label: string
}

type FavoriteComparator = (left: Favorite, right: Favorite) => number

export class FavoriteCollection {
  static readonly defaultSortOrder: FavoriteSortOrder = 'recent'
  static readonly sortOrders: readonly FavoriteSortOption[] = [
    { key: 'recent', label: 'Recently saved' },
    { key: 'oldest', label: 'Oldest first' },
    { key: 'title', label: 'Title' },
    { key: 'artist', label: 'Artist' },
  ]
  static readonly #collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true })
  static readonly empty = new FavoriteCollection([])

  readonly #items: readonly Favorite[]
  readonly #byId: ReadonlyMap<number, Favorite>

  constructor(items: readonly Favorite[]) {
    const byId = new Map<number, Favorite>()
    for (const item of items) {
      if (!byId.has(item.objectId)) byId.set(item.objectId, item)
    }
    this.#byId = byId
    this.#items = byId.size === items.length ? items : Array.from(byId.values())
  }

  static parseSortOrder(value: string | null | undefined): FavoriteSortOrder {
    return FavoriteCollection.sortOrders.find((option) => option.key === value)?.key ?? FavoriteCollection.defaultSortOrder
  }

  get size(): number {
    return this.#items.length
  }

  get isEmpty(): boolean {
    return this.#items.length === 0
  }

  has(objectId: number): boolean {
    return this.#byId.has(objectId)
  }

  get(objectId: number): Favorite | null {
    return this.#byId.get(objectId) ?? null
  }

  filter(term: string): FavoriteCollection {
    if (term.trim() === '') return this
    return new FavoriteCollection(this.#items.filter((favorite) => favorite.matches(term)))
  }

  sort(order: FavoriteSortOrder): FavoriteCollection {
    return new FavoriteCollection(this.#items.toSorted(FavoriteCollection.#comparator(order)))
  }

  upsert(favorite: Favorite): FavoriteCollection {
    if (!this.has(favorite.objectId)) return new FavoriteCollection([favorite, ...this.#items])
    return new FavoriteCollection(
      this.#items.map((item) => (item.objectId === favorite.objectId ? favorite : item)),
    )
  }

  remove(objectId: number): FavoriteCollection {
    if (!this.has(objectId)) return this
    return new FavoriteCollection(this.#items.filter((item) => item.objectId !== objectId))
  }

  toArray(): readonly Favorite[] {
    return this.#items
  }

  static #comparator(order: FavoriteSortOrder): FavoriteComparator {
    switch (order) {
      case 'recent':
        return (left, right) => FavoriteCollection.#byTime(right, left)
      case 'oldest':
        return (left, right) => FavoriteCollection.#byTime(left, right)
      case 'title':
        return (left, right) =>
          FavoriteCollection.#byText(left.title, right.title) || FavoriteCollection.#byText(left.artist, right.artist)
      case 'artist':
        return (left, right) =>
          FavoriteCollection.#byText(left.artist, right.artist) || FavoriteCollection.#byText(left.title, right.title)
    }
  }

  static #byTime(left: Favorite, right: Favorite): number {
    return left.createdAt.getTime() - right.createdAt.getTime() || left.objectId - right.objectId
  }

  static #byText(left: string, right: string): number {
    if (left === '' || right === '') return Number(left === '') - Number(right === '')
    return FavoriteCollection.#collator.compare(left, right)
  }
}
