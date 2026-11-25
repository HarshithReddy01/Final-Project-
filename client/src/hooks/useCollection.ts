import { keepPreviousData, skipToken, useQueries, useQuery } from '@tanstack/react-query'
import { Artwork } from '../lib/met/Artwork.ts'
import { Pagination } from '../lib/met/Pagination.ts'
import type { SearchQuery } from '../lib/met/SearchQuery.ts'
import { type ArtworkLoad, VisibleResults } from '../lib/met/VisibleResults.ts'
import { services } from '../lib/services.ts'
import { QueryKeys } from './QueryKeys.ts'

export function useDepartments() {
  return useQuery({
    queryKey: QueryKeys.departments,
    queryFn: ({ signal }) => services.met.getDepartments(signal),
    staleTime: Infinity,
  })
}

export function useSearch(query: SearchQuery, page: number) {
  return useQuery({
    queryKey: QueryKeys.search(query, page),
    queryFn: ({ signal }) => services.met.search(query, Pagination.window(page), signal),
    placeholderData: keepPreviousData,
  })
}

export function useArtworkLoads(ids: readonly number[]): ArtworkLoad[] {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: QueryKeys.artwork(id),
      queryFn: ({ signal }: { readonly signal: AbortSignal }) => services.met.getArtwork(id, signal),
      staleTime: Infinity,
    })),
    combine: (results) => ids.map((id, index) => VisibleResults.describe(id, results[index])),
  })
}

export function useArtwork(id: number | null) {
  return useQuery({
    queryKey: QueryKeys.artwork(id ?? 0),
    queryFn: Artwork.isValidId(id) ? ({ signal }) => services.met.getArtwork(id, signal) : skipToken,
    staleTime: Infinity,
  })
}
