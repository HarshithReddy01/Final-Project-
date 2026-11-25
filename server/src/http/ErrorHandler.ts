import type { ErrorRequestHandler, Request, RequestHandler } from 'express'
import type { Logger } from '../shared/Logger.ts'
import { HttpError } from './HttpError.ts'

export class ErrorHandler {
  readonly #logger: Logger

  constructor(logger: Logger) {
    this.#logger = logger
  }

  readonly notFound: RequestHandler = () => {
    throw HttpError.notFound()
  }

  readonly handle: ErrorRequestHandler = (error: unknown, request, response, next) => {
    if (response.headersSent) {
      next(error)
      return
    }
    const httpError = this.#toHttpError(error, request)
    response.status(httpError.status).json(httpError)
  }

  #toHttpError(error: unknown, request: Request): HttpError {
    if (error instanceof HttpError) return error
    const bodyParserType = ErrorHandler.#bodyParserType(error)
    if (bodyParserType === 'entity.parse.failed') return HttpError.invalidJson()
    if (bodyParserType === 'entity.too.large') return HttpError.payloadTooLarge()
    this.#logger.error(`${request.method} ${request.originalUrl} failed`, error)
    return HttpError.internal()
  }

  static #bodyParserType(error: unknown): unknown {
    return error instanceof Error && 'type' in error ? error.type : undefined
  }
}
