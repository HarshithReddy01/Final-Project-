import type { Request, RequestHandler, Response } from 'express'
import { RequestContext } from '../http/RequestContext.ts'
import type { User } from '../users/User.ts'
import type { AuthService } from './AuthService.ts'
import type { SessionCookie } from './SessionCookie.ts'

export class AuthMiddleware {
  readonly #auth: AuthService
  readonly #cookie: SessionCookie

  constructor(auth: AuthService, cookie: SessionCookie) {
    this.#auth = auth
    this.#cookie = cookie
  }

  readonly attachUser: RequestHandler = (request, response, next) => {
    RequestContext.setUser(response, this.#resolveUser(request, response))
    next()
  }

  readonly requireUser: RequestHandler = (_request, response, next) => {
    RequestContext.requireUser(response)
    next()
  }

  #resolveUser(request: Request, response: Response): User | null {
    const token = this.#cookie.read(request)
    if (token === null) return null
    const user = this.#auth.resolveSession(token)
    if (user === null) this.#cookie.clear(response)
    return user
  }
}
