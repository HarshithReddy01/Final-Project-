import express from 'express'
import type { RequestHandler, Response, Router } from 'express'
import { RequestContext } from '../http/RequestContext.ts'
import { RequestValidator } from '../http/RequestValidator.ts'
import type { Authentication, AuthService } from './AuthService.ts'
import { BearerToken } from './BearerToken.ts'
import { loginSchema, registrationSchema } from './authSchemas.ts'

export type AuthControllerDependencies = {
  readonly auth: AuthService
  readonly rateLimiter: RequestHandler
}

export class AuthController {
  readonly router: Router
  readonly #auth: AuthService

  constructor({ auth, rateLimiter }: AuthControllerDependencies) {
    this.#auth = auth
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
    AuthController.#sendAuthentication(response, 201, await this.#auth.register(credentials))
  }

  readonly #login: RequestHandler = async (request, response) => {
    const credentials = RequestValidator.parse(loginSchema, request.body)
    AuthController.#sendAuthentication(response, 200, await this.#auth.login(credentials))
  }

  readonly #logout: RequestHandler = async (request, response) => {
    const token = BearerToken.read(request)
    if (token !== null) await this.#auth.logout(token)
    response.status(204).end()
  }

  static #sendAuthentication(response: Response, status: number, { user, session }: Authentication): void {
    response.status(status).json({
      user,
      session: { token: session.token, expiresAt: session.expiresAt.toISOString() },
    })
  }
}
