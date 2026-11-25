import type { RequestHandler } from 'express'

export class CorsPolicy {
  static readonly #allowedMethods = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  static readonly #allowedHeaders = 'Authorization, Content-Type'
  static readonly #preflightMaxAgeSeconds = '600'

  readonly #origins: ReadonlySet<string>

  constructor(origins: readonly string[]) {
    this.#origins = new Set(origins)
  }

  readonly handle: RequestHandler = (request, response, next) => {
    response.vary('Origin')
    const origin = request.get('Origin')
    const isAllowed = origin !== undefined && this.#origins.has(origin)
    if (isAllowed) response.set('Access-Control-Allow-Origin', origin)
    if (request.method !== 'OPTIONS') {
      next()
      return
    }
    if (isAllowed) {
      response.set({
        'Access-Control-Allow-Methods': CorsPolicy.#allowedMethods,
        'Access-Control-Allow-Headers': CorsPolicy.#allowedHeaders,
        'Access-Control-Max-Age': CorsPolicy.#preflightMaxAgeSeconds,
      })
    }
    response.status(204).end()
  }
}
