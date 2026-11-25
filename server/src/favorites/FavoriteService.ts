import { HttpError } from '../http/HttpError.ts'
import type { Clock } from '../shared/Clock.ts'
import { Favorite, type FavoriteSnapshotDto } from './Favorite.ts'
import type { FavoriteRepository } from './FavoriteRepository.ts'

export type SavedFavorite = {
  readonly favorite: Favorite
  readonly created: boolean
}

export class FavoriteService {
  static readonly #missingMessage = 'That work is not in your collection.'

  readonly #favorites: FavoriteRepository
  readonly #clock: Clock

  constructor(favorites: FavoriteRepository, clock: Clock) {
    this.#favorites = favorites
    this.#clock = clock
  }

  list(userId: number): Favorite[] {
    return this.#favorites.listByUser(userId).map((record) => Favorite.fromRecord(record))
  }

  save(userId: number, objectId: number, snapshot: FavoriteSnapshotDto): SavedFavorite {
    const now = this.#clock.now().toISOString()
    const inserted = this.#favorites.insertIfAbsent({
      userId,
      objectId,
      ...snapshot,
      note: '',
      createdAt: now,
      updatedAt: now,
    })
    if (inserted !== null) return { favorite: Favorite.fromRecord(inserted), created: true }
    const existing = this.#favorites.find({ userId, objectId })
    if (existing === null) throw HttpError.notFound(FavoriteService.#missingMessage)
    return { favorite: Favorite.fromRecord(existing), created: false }
  }

  updateNote(userId: number, objectId: number, note: string): Favorite {
    const updated = this.#favorites.updateNote({
      userId,
      objectId,
      note,
      updatedAt: this.#clock.now().toISOString(),
    })
    if (updated === null) throw HttpError.notFound(FavoriteService.#missingMessage)
    return Favorite.fromRecord(updated)
  }

  remove(userId: number, objectId: number): void {
    const removed = this.#favorites.delete({ userId, objectId })
    if (!removed) throw HttpError.notFound(FavoriteService.#missingMessage)
  }
}
