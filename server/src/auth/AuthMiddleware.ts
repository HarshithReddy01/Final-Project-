import type { RequestHandler } from 'express'
import { RequestContext } from '../http/RequestContext.ts'
import type { AuthService } from './AuthService.ts'
import { BearerToken } from './BearerToken.ts'

export class AuthMiddleware {
  readonly #auth: AuthService

  constructor(auth: AuthService) {
    this.#auth = auth
  }

  readonly attachUser: RequestHandler = async (request, response, next) => {
    const token = BearerToken.read(request)
    RequestContext.setUser(response, token === null ? null : await this.#auth.resolveSession(token))
    next()
  }

  readonly requireUser: RequestHandler = (_request, response, next) => {
    RequestContext.requireUser(response)
    next()
  }
}
