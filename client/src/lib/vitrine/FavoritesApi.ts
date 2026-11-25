import { ApiError } from '../http/ApiError.ts'
import type { HttpClient } from '../http/HttpClient.ts'
import type { FavoriteResponseDto, FavoriteSnapshotDto, FavoritesResponseDto } from './dto.ts'
import { Favorite } from './Favorite.ts'

export class FavoritesApi {
  readonly #http: HttpClient

  constructor(http: HttpClient) {
    this.#http = http
  }

  async list(signal?: AbortSignal): Promise<Favorite[]> {
    const { favorites } = await this.#http.get<FavoritesResponseDto>('/favorites', { signal })
    return favorites.map((favorite) => Favorite.fromDto(favorite))
  }

  async save(objectId: number, snapshot: FavoriteSnapshotDto): Promise<Favorite> {
    const { favorite } = await this.#http.put<FavoriteResponseDto>(FavoritesApi.#path(objectId), snapshot)
    return Favorite.fromDto(favorite)
  }

  async updateNote(objectId: number, note: string): Promise<Favorite> {
    const { favorite } = await this.#http.patch<FavoriteResponseDto>(FavoritesApi.#path(objectId), { note })
    return Favorite.fromDto(favorite)
  }

  async remove(objectId: number): Promise<void> {
    try {
      await this.#http.delete(FavoritesApi.#path(objectId))
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) return
      throw error
    }
  }

  static #path(objectId: number): string {
    return `/favorites/${objectId}`
  }
}
