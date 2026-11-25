import { queryOptions, skipToken } from '@tanstack/react-query'
import { Artwork } from '../lib/met/Artwork.ts'
import { services } from '../lib/services.ts'
import { QueryKeys } from './QueryKeys.ts'

export class ArtworkQuery {
  static options(id: number | null) {
    return queryOptions({
      queryKey: QueryKeys.artwork(id ?? 0),
      queryFn: Artwork.isValidId(id) ? ({ signal }) => services.met.getArtwork(id, signal) : skipToken,
      staleTime: Infinity,
    })
  }
}
