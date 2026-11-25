import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../lib/http/ApiError.ts'
import { services } from '../lib/services.ts'
import type { FavoriteSnapshotDto } from '../lib/vitrine/dto.ts'
import { Favorite } from '../lib/vitrine/Favorite.ts'
import { FavoriteCollection } from '../lib/vitrine/FavoriteCollection.ts'
import { FavoritesCache } from './FavoritesCache.ts'
import { QueryKeys } from './QueryKeys.ts'
import { useSession } from './useSession.ts'

export type FavoritesState = {
  readonly collection: FavoriteCollection
  readonly isPending: boolean
  readonly error: Error | null
}

export type SaveFavoriteInput = {
  readonly objectId: number
  readonly snapshot: FavoriteSnapshotDto
}

export type UpdateNoteInput = {
  readonly objectId: number
  readonly note: string
}

export function useFavorites(): FavoritesState {
  const { user } = useSession()
  const query = useQuery({
    queryKey: QueryKeys.favorites,
    queryFn: async ({ signal }) => new FavoriteCollection(await services.favorites.list(signal)),
    enabled: user !== null,
  })
  if (user === null) return { collection: FavoriteCollection.empty, isPending: false, error: null }
  return { collection: query.data ?? FavoriteCollection.empty, isPending: query.isPending, error: query.error }
}

export function useSaveFavorite() {
  const cache = new FavoritesCache(useQueryClient())
  return useMutation({
    mutationFn: ({ objectId, snapshot }: SaveFavoriteInput) => services.favorites.save(objectId, snapshot),
    onMutate: ({ objectId, snapshot }) =>
      cache.beginUpdate((collection) => collection.upsert(Favorite.draft(objectId, snapshot, new Date()))),
    onError: (error, _input, snapshot) => cache.rollback(snapshot, error),
    onSuccess: (favorite) => cache.update((collection) => collection.upsert(favorite)),
  })
}

export function useRemoveFavorite() {
  const cache = new FavoritesCache(useQueryClient())
  return useMutation({
    mutationFn: (objectId: number) => services.favorites.remove(objectId),
    onMutate: (objectId) => cache.beginUpdate((collection) => collection.remove(objectId)),
    onError: (error, _objectId, snapshot) => cache.rollback(snapshot, error),
  })
}

export function useUpdateFavoriteNote() {
  const cache = new FavoritesCache(useQueryClient())
  return useMutation({
    mutationFn: ({ objectId, note }: UpdateNoteInput) => services.favorites.updateNote(objectId, note),
    onSuccess: (favorite) => cache.update((collection) => collection.upsert(favorite)),
    onError: (error) => {
      if (error instanceof ApiError && error.isNotFound) cache.refresh()
    },
  })
}
