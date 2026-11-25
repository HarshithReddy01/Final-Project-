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

  async list(userId: number): Promise<Favorite[]> {
    const records = await this.#favorites.listByUser(userId)
    return records.map((record) => Favorite.fromRecord(record))
  }

  async save(userId: number, objectId: number, snapshot: FavoriteSnapshotDto): Promise<SavedFavorite> {
    const now = this.#clock.now().toISOString()
    const inserted = await this.#favorites.insertIfAbsent({
      userId,
      objectId,
      ...snapshot,
      note: '',
      createdAt: now,
      updatedAt: now,
    })
    if (inserted !== null) return { favorite: Favorite.fromRecord(inserted), created: true }
    const existing = await this.#favorites.find({ userId, objectId })
    if (existing === null) throw HttpError.notFound(FavoriteService.#missingMessage)
    return { favorite: Favorite.fromRecord(existing), created: false }
  }

  async updateNote(userId: number, objectId: number, note: string): Promise<Favorite> {
    const updated = await this.#favorites.updateNote({
      userId,
      objectId,
      note,
      updatedAt: this.#clock.now().toISOString(),
    })
    if (updated === null) throw HttpError.notFound(FavoriteService.#missingMessage)
    return Favorite.fromRecord(updated)
  }

  async remove(userId: number, objectId: number): Promise<void> {
    const removed = await this.#favorites.delete({ userId, objectId })
    if (!removed) throw HttpError.notFound(FavoriteService.#missingMessage)
  }
}
