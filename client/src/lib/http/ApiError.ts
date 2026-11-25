import { TypeGuard } from '../TypeGuard.ts'
import { HttpStatus } from './HttpStatus.ts'

export type ApiErrorFields = Readonly<Record<string, string>>

type ErrorBody = {
  readonly code: string
  readonly message: string
  readonly fields: ApiErrorFields
}

export class ApiError extends Error {
  static readonly fallbackMessage = 'Something went wrong. Try again in a moment.'
  static readonly #codesByStatus: ReadonlyMap<number, string> = new Map([
    [HttpStatus.badRequest, 'bad_request'],
    [HttpStatus.unauthorized, 'unauthenticated'],
    [HttpStatus.notFound, 'not_found'],
    [HttpStatus.conflict, 'conflict'],
    [HttpStatus.tooManyRequests, 'rate_limited'],
  ])

  readonly status: number
  readonly code: string
  readonly fields: ApiErrorFields

  constructor(status: number, code: string, message: string, fields: ApiErrorFields = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }

  get isUnauthorized(): boolean {
    return this.status === HttpStatus.unauthorized
  }

  get isNotFound(): boolean {
    return this.status === HttpStatus.notFound
  }

  get isNetworkError(): boolean {
    return this.status === HttpStatus.network
  }

  fieldError(name: string): string | null {
    return this.fields[name] ?? null
  }

  static network(): ApiError {
    return new ApiError(
      HttpStatus.network,
      'network_error',
      "Can't reach the server. Check your connection and try again.",
    )
  }

  static unreadable(status: number): ApiError {
    return new ApiError(status, 'unreadable_response', 'The server sent a response we couldn’t read. Try again in a moment.')
  }

  static fromResponse(status: number, body: unknown): ApiError {
    const error = ApiError.#readErrorBody(body)
    if (error !== null) return new ApiError(status, error.code, error.message, error.fields)
    return new ApiError(
      status,
      ApiError.#codesByStatus.get(status) ?? 'http_error',
      ApiError.#readMessage(body) ?? ApiError.fallbackMessage,
    )
  }

  static #readErrorBody(body: unknown): ErrorBody | null {
    if (!TypeGuard.isRecord(body) || !TypeGuard.isRecord(body.error)) return null
    const { code, message, fields } = body.error
    if (typeof code !== 'string' || typeof message !== 'string') return null
    return { code, message, fields: TypeGuard.isStringRecord(fields) ? fields : {} }
  }

  static #readMessage(body: unknown): string | null {
    if (!TypeGuard.isRecord(body) || typeof body.message !== 'string') return null
    const message = body.message.trim()
    return message === '' ? null : message
  }
}
