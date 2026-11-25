import type { Express } from 'express'
import request from 'supertest'
import type { Agent, Response, Test } from 'supertest'
import { App } from '../../src/App.ts'
import { AppConfig, type RateLimitPolicy, type TrustProxySetting } from '../../src/config/AppConfig.ts'
import { Database } from '../../src/database/Database.ts'
import { migrations } from '../../src/database/migrations.ts'
import { Logger } from '../../src/shared/Logger.ts'
import { FakeClock } from './FakeClock.ts'

export type TestAppOptions = {
  readonly authRateLimit?: RateLimitPolicy
  readonly allowedOrigins?: readonly string[]
  readonly trustProxy?: TrustProxySetting
  readonly logger?: Logger
}

export class TestUser {
  readonly token: string
  readonly #app: TestApp

  constructor(app: TestApp, token: string) {
    this.#app = app
    this.token = token
  }

  get(path: string): Test {
    return this.#authorize(this.#app.request().get(path))
  }

  post(path: string): Test {
    return this.#authorize(this.#app.request().post(path))
  }

  put(path: string): Test {
    return this.#authorize(this.#app.request().put(path))
  }

  patch(path: string): Test {
    return this.#authorize(this.#app.request().patch(path))
  }

  delete(path: string): Test {
    return this.#authorize(this.#app.request().delete(path))
  }

  #authorize(test: Test): Test {
    return test.set('Authorization', `Bearer ${this.token}`)
  }
}

export class TestApp {
  static readonly password = 'correct horse battery staple'
  static readonly #bcryptRounds = 4

  readonly clock = new FakeClock()
  readonly config: AppConfig
  readonly database: Database
  readonly express: Express

  private constructor({ authRateLimit, allowedOrigins, trustProxy, logger = Logger.silent() }: TestAppOptions) {
    this.config = new AppConfig({
      environment: 'test',
      databaseUrl: Database.inMemory,
      bcryptRounds: TestApp.#bcryptRounds,
      authRateLimit,
      allowedOrigins,
      trustProxy,
    })
    this.database = new Database(this.config.database)
    this.express = new App({ config: this.config, database: this.database, clock: this.clock, logger }).express
  }

  static async create(options: TestAppOptions = {}): Promise<TestApp> {
    const app = new TestApp(options)
    await app.database.migrate(migrations)
    return app
  }

  static sessionToken(response: Response): string {
    const token: unknown = response.body?.session?.token
    if (typeof token !== 'string' || token === '') throw new Error('The response did not start a session')
    return token
  }

  request(): Agent {
    return request(this.express)
  }

  register(username: string, password: string = TestApp.password): Promise<Response> {
    return this.request().post('/api/auth/register').send({ username, password })
  }

  login(username: string, password: string = TestApp.password): Promise<Response> {
    return this.request().post('/api/auth/login').send({ username, password })
  }

  async signUp(username: string): Promise<TestUser> {
    const response = await this.register(username)
    if (response.status !== 201) throw new Error(`Registering ${username} failed with status ${response.status}`)
    return this.as(TestApp.sessionToken(response))
  }

  as(token: string): TestUser {
    return new TestUser(this, token)
  }

  close(): void {
    this.database.close()
  }
}
