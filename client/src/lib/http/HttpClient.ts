import { ApiError } from './ApiError.ts'
import { HttpStatus } from './HttpStatus.ts'

export type HttpClientOptions = {
  readonly credentials: RequestCredentials
}

export type RequestOptions = {
  readonly query?: URLSearchParams
  readonly signal?: AbortSignal
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export class HttpClient {
  readonly #baseUrl: string
  readonly #credentials: RequestCredentials

  constructor(baseUrl: string, options: HttpClientOptions) {
    this.#baseUrl = baseUrl
    this.#credentials = options.credentials
  }

  get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.#send('GET', path, undefined, options) as Promise<T>
  }

  post<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.#send('POST', path, body, options) as Promise<T>
  }

  put<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    return this.#send('PUT', path, body, options) as Promise<T>
  }

  patch<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    return this.#send('PATCH', path, body, options) as Promise<T>
  }

  async delete(path: string, options: RequestOptions = {}): Promise<void> {
    await this.#send('DELETE', path, undefined, options)
  }

  async #send(method: HttpMethod, path: string, body: unknown, options: RequestOptions): Promise<unknown> {
    const response = await fetch(this.#url(path, options.query), {
      method,
      credentials: this.#credentials,
      headers: HttpClient.#headers(body),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
    }).catch(HttpClient.#rethrow)
    const payload = await HttpClient.#readBody(response).catch(HttpClient.#rethrow)
    if (!response.ok) throw ApiError.fromResponse(response.status, payload)
    return payload
  }

  #url(path: string, query: URLSearchParams | undefined): string {
    const search = query?.toString() ?? ''
    return search === '' ? `${this.#baseUrl}${path}` : `${this.#baseUrl}${path}?${search}`
  }

  static #headers(body: unknown): HeadersInit {
    if (body === undefined) return { Accept: 'application/json' }
    return { Accept: 'application/json', 'Content-Type': 'application/json' }
  }

  static async #readBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('Content-Type') ?? ''
    if (response.status === HttpStatus.noContent || !contentType.includes('json')) return undefined
    try {
      return await response.json()
    } catch (error) {
      if (error instanceof SyntaxError) return undefined
      throw error
    }
  }

  static #rethrow(error: unknown): never {
    if (error instanceof TypeError) throw ApiError.network()
    throw error
  }
}
