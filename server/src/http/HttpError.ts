export type ErrorCode =
  | 'validation_failed'
  | 'invalid_json'
  | 'unauthenticated'
  | 'invalid_credentials'
  | 'not_found'
  | 'username_taken'
  | 'payload_too_large'
  | 'rate_limited'
  | 'internal_error'

export type FieldErrors = Readonly<Record<string, string>>

export type ErrorDto = {
  error: { code: ErrorCode; message: string; fields?: FieldErrors }
}

export class HttpError extends Error {
  static readonly #statuses: Readonly<Record<ErrorCode, number>> = {
    validation_failed: 400,
    invalid_json: 400,
    unauthenticated: 401,
    invalid_credentials: 401,
    not_found: 404,
    username_taken: 409,
    payload_too_large: 413,
    rate_limited: 429,
    internal_error: 500,
  }

  override readonly name = 'HttpError'
  readonly code: ErrorCode
  readonly status: number
  readonly fields: FieldErrors | undefined

  constructor(code: ErrorCode, message: string, fields?: FieldErrors) {
    super(message)
    this.code = code
    this.status = HttpError.#statuses[code]
    this.fields = fields
  }

  static validationFailed(fields: FieldErrors): HttpError {
    return new HttpError('validation_failed', 'Some fields need attention.', fields)
  }

  static invalidJson(): HttpError {
    return new HttpError('invalid_json', 'The request body is not valid JSON.')
  }

  static unauthorized(): HttpError {
    return new HttpError('unauthenticated', 'Sign in to continue.')
  }

  static invalidCredentials(): HttpError {
    return new HttpError('invalid_credentials', 'Incorrect username or password.')
  }

  static notFound(message = 'Not found.'): HttpError {
    return new HttpError('not_found', message)
  }

  static usernameTaken(): HttpError {
    const message = 'That username is taken.'
    return new HttpError('username_taken', message, { username: message })
  }

  static payloadTooLarge(): HttpError {
    return new HttpError('payload_too_large', 'The request body is too large.')
  }

  static rateLimited(): HttpError {
    return new HttpError('rate_limited', 'Too many attempts. Try again in a few minutes.')
  }

  static internal(): HttpError {
    return new HttpError('internal_error', 'Something went wrong on our side.')
  }

  toJSON(): ErrorDto {
    const { code, message, fields } = this
    return { error: fields === undefined ? { code, message } : { code, message, fields } }
  }
}
