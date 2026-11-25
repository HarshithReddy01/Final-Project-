import type { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../lib/http/ApiError.ts'
import type { FavoriteCollection } from '../lib/vitrine/FavoriteCollection.ts'
import { QueryKeys } from './QueryKeys.ts'

export type FavoritesSnapshot = FavoriteCollection | undefined

export class FavoritesCache {
  readonly #client: QueryClient

  constructor(client: QueryClient) {
    this.#client = client
  }

  async beginUpdate(change: (collection: FavoriteCollection) => FavoriteCollection): Promise<FavoritesSnapshot> {
    await this.#client.cancelQueries({ queryKey: QueryKeys.favorites })
    const snapshot = this.#client.getQueryData<FavoriteCollection>(QueryKeys.favorites)
    this.update(change)
    return snapshot
  }

  update(change: (collection: FavoriteCollection) => FavoriteCollection): void {
    this.#client.setQueryData<FavoriteCollection>(QueryKeys.favorites, (current) =>
      current === undefined ? undefined : change(current),
    )
  }

  rollback(snapshot: FavoritesSnapshot, error: Error): void {
    if (error instanceof ApiError && error.isUnauthorized) return
    if (snapshot !== undefined) this.#client.setQueryData<FavoriteCollection>(QueryKeys.favorites, snapshot)
    this.refresh()
  }

  refresh(): void {
    void this.#client.invalidateQueries({ queryKey: QueryKeys.favorites })
  }
}
