import express from 'express'
import type { RequestHandler, Response, Router } from 'express'
import { RequestContext } from '../http/RequestContext.ts'
import { RequestValidator } from '../http/RequestValidator.ts'
import type { Authentication, AuthService } from './AuthService.ts'
import { loginSchema, registrationSchema } from './authSchemas.ts'
import type { SessionCookie } from './SessionCookie.ts'

export type AuthControllerDependencies = {
  readonly auth: AuthService
  readonly cookie: SessionCookie
  readonly rateLimiter: RequestHandler
}

export class AuthController {
  readonly router: Router
  readonly #auth: AuthService
  readonly #cookie: SessionCookie

  constructor({ auth, cookie, rateLimiter }: AuthControllerDependencies) {
    this.#auth = auth
    this.#cookie = cookie
    this.router = express.Router()
    this.router.get('/session', this.#session)
    this.router.post('/register', rateLimiter, this.#register)
    this.router.post('/login', rateLimiter, this.#login)
    this.router.post('/logout', this.#logout)
  }

  readonly #session: RequestHandler = (_request, response) => {
    response.json({ user: RequestContext.getUser(response) })
  }

  readonly #register: RequestHandler = async (request, response) => {
    const credentials = RequestValidator.parse(registrationSchema, request.body)
    const authentication = await this.#auth.register(credentials)
    this.#sendAuthentication(response, 201, authentication)
  }

  readonly #login: RequestHandler = async (request, response) => {
    const credentials = RequestValidator.parse(loginSchema, request.body)
    const authentication = await this.#auth.login(credentials)
    this.#sendAuthentication(response, 200, authentication)
  }

  readonly #logout: RequestHandler = (request, response) => {
    const token = this.#cookie.read(request)
    if (token !== null && RequestContext.getUser(response) !== null) {
      this.#auth.logout(token)
      this.#cookie.clear(response)
    }
    response.status(204).end()
  }

  #sendAuthentication(response: Response, status: number, { user, session }: Authentication): void {
    this.#cookie.write(response, session.token, session.expiresAt)
    response.status(status).json({ user })
  }
}
