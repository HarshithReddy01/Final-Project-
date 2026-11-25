import path from 'node:path'
import { z } from 'zod'
import { Database } from '../database/Database.ts'

export type AppEnvironment = 'development' | 'production' | 'test'

export type RateLimitPolicy = {
  readonly windowMs: number
  readonly limit: number
}

export type AppConfigOptions = {
  readonly port?: number
  readonly environment?: AppEnvironment
  readonly databasePath?: string
  readonly sessionTtlDays?: number
  readonly bcryptRounds?: number
  readonly clientDistPath?: string
  readonly authRateLimit?: RateLimitPolicy
}

export class AppConfig {
  static readonly #packageRoot = path.resolve(import.meta.dirname, '..', '..')

  static readonly #defaults = {
    port: 3001,
    environment: 'development',
    databasePath: 'data/vitrine.db',
    sessionTtlDays: 14,
    bcryptRounds: 12,
    clientDistPath: '../client/dist',
    authRateLimit: { windowMs: 15 * 60_000, limit: 20 },
  } as const satisfies Required<AppConfigOptions>

  static readonly #millisecondsPerDay = 24 * 60 * 60 * 1000

  static readonly #environmentSchema = z.object({
    PORT: z.coerce.number().int().min(1).max(65_535).optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
    DATABASE_PATH: z.string().min(1).optional(),
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).optional(),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).optional(),
    CLIENT_DIST_PATH: z.string().min(1).optional(),
  })

  readonly port: number
  readonly environment: AppEnvironment
  readonly databasePath: string
  readonly sessionTtlMs: number
  readonly bcryptRounds: number
  readonly clientDistPath: string
  readonly authRateLimit: RateLimitPolicy

  constructor(options: AppConfigOptions = {}) {
    const defaults = AppConfig.#defaults
    this.port = options.port ?? defaults.port
    this.environment = options.environment ?? defaults.environment
    this.databasePath = AppConfig.#resolveDatabasePath(options.databasePath ?? defaults.databasePath)
    this.sessionTtlMs = (options.sessionTtlDays ?? defaults.sessionTtlDays) * AppConfig.#millisecondsPerDay
    this.bcryptRounds = options.bcryptRounds ?? defaults.bcryptRounds
    this.clientDistPath = path.resolve(AppConfig.#packageRoot, options.clientDistPath ?? defaults.clientDistPath)
    this.authRateLimit = options.authRateLimit ?? defaults.authRateLimit
  }

  get isProduction(): boolean {
    return this.environment === 'production'
  }

  static fromEnvironment(env: Readonly<Record<string, string | undefined>> = process.env): AppConfig {
    const parsed = AppConfig.#environmentSchema.safeParse(env)
    if (!parsed.success) throw new Error(AppConfig.#describe(parsed.error))
    const variables = parsed.data
    return new AppConfig({
      port: variables.PORT,
      environment: variables.NODE_ENV,
      databasePath: variables.DATABASE_PATH,
      sessionTtlDays: variables.SESSION_TTL_DAYS,
      bcryptRounds: variables.BCRYPT_ROUNDS,
      clientDistPath: variables.CLIENT_DIST_PATH,
    })
  }

  static #resolveDatabasePath(databasePath: string): string {
    if (databasePath === Database.inMemory) return databasePath
    return path.resolve(AppConfig.#packageRoot, databasePath)
  }

  static #describe(error: z.ZodError): string {
    const problems = error.issues.map((issue) => `  ${issue.path.map(String).join('.')}: ${issue.message}`)
    return ['Invalid environment variables:', ...problems].join('\n')
  }
}
