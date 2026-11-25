import { existsSync } from 'node:fs'
import path from 'node:path'
import cookieParser from 'cookie-parser'
import express from 'express'
import type { Express, RequestHandler, Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { AuthController } from './auth/AuthController.ts'
import { AuthMiddleware } from './auth/AuthMiddleware.ts'
import { AuthService } from './auth/AuthService.ts'
import { PasswordHasher } from './auth/PasswordHasher.ts'
import { SessionCookie } from './auth/SessionCookie.ts'
import { SessionRepository } from './auth/SessionRepository.ts'
import { SessionTokens } from './auth/SessionTokens.ts'
import type { AppConfig, RateLimitPolicy } from './config/AppConfig.ts'
import type { Database } from './database/Database.ts'
import { FavoriteController } from './favorites/FavoriteController.ts'
import { FavoriteRepository } from './favorites/FavoriteRepository.ts'
import { FavoriteService } from './favorites/FavoriteService.ts'
import { ErrorHandler } from './http/ErrorHandler.ts'
import { HttpError } from './http/HttpError.ts'
import type { Clock } from './shared/Clock.ts'
import type { Logger } from './shared/Logger.ts'
import { UserRepository } from './users/UserRepository.ts'

export type AppDependencies = {
  readonly config: AppConfig
  readonly database: Database
  readonly clock: Clock
  readonly logger: Logger
}

export class App {
  static readonly #jsonBodyLimit = '16kb'
  static readonly #assetMaxAge = '1y'
  static readonly #contentSecurityPolicy = {
    'default-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'https://images.metmuseum.org'],
    'connect-src': ["'self'", 'https://collectionapi.metmuseum.org'],
    'font-src': ["'self'", 'data:'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'script-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
  }

  readonly express: Express
  readonly #errorHandler: ErrorHandler

  constructor(dependencies: AppDependencies) {
    this.#errorHandler = new ErrorHandler(dependencies.logger)
    this.express = express()
    this.express.disable('x-powered-by')
    this.express.use(
      helmet({ contentSecurityPolicy: { useDefaults: false, directives: App.#contentSecurityPolicy } }),
      express.json({ limit: App.#jsonBodyLimit }),
      cookieParser(),
    )
    this.express.use('/api', this.#createApiRouter(dependencies))
    this.#serveClient(dependencies)
    this.express.use(this.#errorHandler.handle)
  }

  #createApiRouter({ config, database, clock }: AppDependencies): Router {
    const cookie = new SessionCookie({ secure: config.isProduction })
    const auth = new AuthService({
      database,
      users: new UserRepository(database),
      sessions: new SessionRepository(database),
      hasher: new PasswordHasher(config.bcryptRounds),
      tokens: new SessionTokens(),
      clock,
      sessionTtlMs: config.sessionTtlMs,
    })
    const authMiddleware = new AuthMiddleware(auth, cookie)
    const authController = new AuthController({
      auth,
      cookie,
      rateLimiter: App.#createRateLimiter(config.authRateLimit),
    })
    const favoriteController = new FavoriteController(new FavoriteService(new FavoriteRepository(database), clock))

    const api = express.Router()
    api.use(authMiddleware.attachUser)
    api.get('/health', (_request, response) => {
      response.json({ status: 'ok' })
    })
    api.use('/auth', authController.router)
    api.use('/favorites', authMiddleware.requireUser, favoriteController.router)
    api.use(this.#errorHandler.notFound)
    return api
  }

  #serveClient({ config, logger }: AppDependencies): void {
    if (config.environment === 'test') return
    const indexFile = path.join(config.clientDistPath, 'index.html')
    if (!existsSync(indexFile)) {
      if (config.isProduction) logger.warn(`No client build at ${config.clientDistPath}; serving the API only.`)
      return
    }
    this.express.use(
      '/assets',
      express.static(path.join(config.clientDistPath, 'assets'), {
        index: false,
        immutable: true,
        maxAge: App.#assetMaxAge,
      }),
      this.#errorHandler.notFound,
    )
    this.express.use(express.static(config.clientDistPath, { index: false }))
    this.express.get('/{*path}', (_request, response) => {
      response.sendFile(indexFile)
    })
  }

  static #createRateLimiter({ windowMs, limit }: RateLimitPolicy): RequestHandler {
    return rateLimit({
      windowMs,
      limit,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_request, _response, next) => {
        next(HttpError.rateLimited())
      },
    })
  }
}
