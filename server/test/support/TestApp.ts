import type { Express } from 'express'
import request from 'supertest'
import type { Agent, Response } from 'supertest'
import { App } from '../../src/App.ts'
import { SessionCookie } from '../../src/auth/SessionCookie.ts'
import { AppConfig, type RateLimitPolicy } from '../../src/config/AppConfig.ts'
import { Database } from '../../src/database/Database.ts'
import { migrations } from '../../src/database/migrations.ts'
import { Logger } from '../../src/shared/Logger.ts'
import { FakeClock } from './FakeClock.ts'

export type TestAppOptions = {
  readonly authRateLimit?: RateLimitPolicy
  readonly logger?: Logger
}

export class TestApp {
  static readonly password = 'correct horse battery staple'
  static readonly #bcryptRounds = 4

  readonly clock = new FakeClock()
  readonly config: AppConfig
  readonly database: Database
  readonly express: Express

  constructor({ authRateLimit, logger = Logger.silent() }: TestAppOptions = {}) {
    this.config = new AppConfig({
      environment: 'test',
      databasePath: Database.inMemory,
      bcryptRounds: TestApp.#bcryptRounds,
      authRateLimit,
    })
    this.database = new Database(this.config.databasePath)
    this.database.migrate(migrations)
    this.express = new App({ config: this.config, database: this.database, clock: this.clock, logger }).express
  }

  static sessionCookie(response: Response): string | undefined {
    return response.get('Set-Cookie')?.find((cookie) => cookie.startsWith(`${SessionCookie.cookieName}=`))
  }

  static sessionToken(response: Response): string {
    const token = TestApp.sessionCookie(response)?.split(';', 1)[0]?.slice(`${SessionCookie.cookieName}=`.length)
    if (token === undefined || token === '') throw new Error('The response did not start a session')
    return token
  }

  request(): Agent {
    return request(this.express)
  }

  agent(): Agent {
    return request.agent(this.express)
  }

  async register(username: string, password: string = TestApp.password): Promise<Response> {
    return this.request().post('/api/auth/register').send({ username, password })
  }

  async login(username: string, password: string = TestApp.password): Promise<Response> {
    return this.request().post('/api/auth/login').send({ username, password })
  }

  async signUp(username: string): Promise<Agent> {
    const agent = this.agent()
    const response = await agent.post('/api/auth/register').send({ username, password: TestApp.password })
    if (response.status !== 201) throw new Error(`Registering ${username} failed with status ${response.status}`)
    return agent
  }

  close(): void {
    this.database.close()
  }
}
