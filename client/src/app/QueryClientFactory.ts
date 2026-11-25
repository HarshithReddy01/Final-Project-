import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { QueryKeys } from '../hooks/QueryKeys.ts'
import { SessionCache } from '../hooks/SessionCache.ts'
import { ApiError } from '../lib/http/ApiError.ts'
import { HttpStatus } from '../lib/http/HttpStatus.ts'
import { services } from '../lib/services.ts'

export class QueryClientFactory {
  static readonly staleTime = 5 * 60_000
  static readonly gcTime = 30 * 60_000
  static readonly maxRetries = 2
  static readonly #finalStatuses: ReadonlySet<number> = new Set([
    HttpStatus.badRequest,
    HttpStatus.unauthorized,
    HttpStatus.notFound,
    HttpStatus.conflict,
  ])

  create(): QueryClient {
    const client: QueryClient = new QueryClient({
      queryCache: new QueryCache({
        onError: (error, query) => {
          if (QueryKeys.isVitrine(query.queryKey)) QueryClientFactory.#endSessionOn(client, error)
        },
      }),
      mutationCache: new MutationCache({
        onError: (error) => QueryClientFactory.#endSessionOn(client, error),
      }),
      defaultOptions: {
        queries: {
          staleTime: QueryClientFactory.staleTime,
          gcTime: QueryClientFactory.gcTime,
          refetchOnWindowFocus: false,
          retry: (failureCount, error) => QueryClientFactory.#shouldRetry(failureCount, error),
        },
      },
    })
    return client
  }

  static #endSessionOn(client: QueryClient, error: Error): void {
    if (!(error instanceof ApiError && error.isUnauthorized)) return
    services.auth.forgetSession()
    new SessionCache(client).signedOut()
  }

  static #shouldRetry(failureCount: number, error: Error): boolean {
    if (failureCount >= QueryClientFactory.maxRetries) return false
    return !(error instanceof ApiError && QueryClientFactory.#finalStatuses.has(error.status))
  }
}
