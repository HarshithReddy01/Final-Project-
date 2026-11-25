import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { z } from 'zod'
import { Database, type DatabaseLocation } from '../database/Database.ts'

export type AppEnvironment = 'development' | 'production' | 'test'

export type RateLimitPolicy = {
  readonly windowMs: number
  readonly limit: number
}

export type TrustProxySetting = number | false

export type AppConfigOptions = {
  readonly port?: number | undefined
  readonly environment?: AppEnvironment | undefined
  readonly databaseUrl?: string | undefined
  readonly databaseAuthToken?: string | undefined
  readonly sessionTtlDays?: number | undefined
  readonly bcryptRounds?: number | undefined
  readonly clientDistPath?: string | undefined
  readonly allowedOrigins?: readonly string[] | undefined
  readonly trustProxy?: TrustProxySetting | undefined
  readonly authRateLimit?: RateLimitPolicy | undefined
}

export class AppConfig {
  static readonly #packageRoot = path.resolve(import.meta.dirname, '..', '..')

  static readonly #defaults = {
    port: 3001,
    environment: 'development',
    databaseUrl: 'data/vitrine.db',
    sessionTtlDays: 14,
    bcryptRounds: 12,
    clientDistPath: '../client/dist',
    localOrigins: ['http://localhost:5173', 'http://localhost:4173'],
    productionTrustProxy: 1,
    authRateLimit: { windowMs: 15 * 60_000, limit: 20 },
  } as const

  static readonly #millisecondsPerDay = 24 * 60 * 60 * 1000
  static readonly #schemePattern = /^[a-z][a-z\d+.-]+:/i
  static readonly #remoteSchemePattern = /^(libsql|https?|wss?):/i

  static readonly #originSchema = z.string().refine((value) => URL.canParse(value) && new URL(value).origin === value, {
    message: 'Use an origin such as https://example.github.io, without a path or trailing slash.',
  })

  static readonly #environmentSchema = z
    .object({
      PORT: z.coerce.number().int().min(1).max(65_535).optional(),
      NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
      TURSO_DATABASE_URL: z.string().min(1).optional(),
      TURSO_AUTH_TOKEN: z.string().min(1).optional(),
      SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).optional(),
      BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).optional(),
      CLIENT_DIST_PATH: z.string().min(1).optional(),
      ALLOWED_ORIGINS: z
        .string()
        .transform((value) =>
          value
            .split(',')
            .map((origin) => origin.trim())
            .filter((origin) => origin !== ''),
        )
        .pipe(z.array(AppConfig.#originSchema).min(1))
        .optional(),
      TRUST_PROXY: z
        .string()
        .regex(/^(false|\d)$/, 'Use false or a number of proxy hops from 0 to 9.')
        .transform((value): TrustProxySetting => (value === 'false' ? false : Number(value)))
        .optional(),
    })
    .superRefine((variables, context) => {
      if (variables.NODE_ENV !== 'production' || variables.ALLOWED_ORIGINS !== undefined) return
      context.addIssue({
        code: 'custom',
        path: ['ALLOWED_ORIGINS'],
        message: 'Required in production: the comma-separated origins allowed to call the API.',
      })
    })

  readonly port: number
  readonly environment: AppEnvironment
  readonly database: DatabaseLocation
  readonly sessionTtlMs: number
  readonly bcryptRounds: number
  readonly clientDistPath: string
  readonly allowedOrigins: readonly string[]
  readonly trustProxy: TrustProxySetting
  readonly authRateLimit: RateLimitPolicy

  constructor(options: AppConfigOptions = {}) {
    const defaults = AppConfig.#defaults
    this.port = options.port ?? defaults.port
    this.environment = options.environment ?? defaults.environment
    this.database = AppConfig.#locateDatabase(options.databaseUrl ?? defaults.databaseUrl, options.databaseAuthToken)
    this.sessionTtlMs = (options.sessionTtlDays ?? defaults.sessionTtlDays) * AppConfig.#millisecondsPerDay
    this.bcryptRounds = options.bcryptRounds ?? defaults.bcryptRounds
    this.clientDistPath = path.resolve(AppConfig.#packageRoot, options.clientDistPath ?? defaults.clientDistPath)
    this.allowedOrigins = options.allowedOrigins ?? (this.isProduction ? [] : defaults.localOrigins)
    this.trustProxy = options.trustProxy ?? (this.isProduction ? defaults.productionTrustProxy : false)
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
      databaseUrl: variables.TURSO_DATABASE_URL,
      databaseAuthToken: variables.TURSO_AUTH_TOKEN,
      sessionTtlDays: variables.SESSION_TTL_DAYS,
      bcryptRounds: variables.BCRYPT_ROUNDS,
      clientDistPath: variables.CLIENT_DIST_PATH,
      allowedOrigins: variables.ALLOWED_ORIGINS,
      trustProxy: variables.TRUST_PROXY,
    })
  }

  static #locateDatabase(location: string, authToken: string | undefined): DatabaseLocation {
    if (location === Database.inMemory) return { url: location }
    if (AppConfig.#remoteSchemePattern.test(location)) return { url: location, authToken }
    if (AppConfig.#schemePattern.test(location)) return { url: location }
    return { url: pathToFileURL(path.resolve(AppConfig.#packageRoot, location)).href }
  }

  static #describe(error: z.ZodError): string {
    const problems = error.issues.map((issue) => `  ${issue.path.map(String).join('.')}: ${issue.message}`)
    return ['Invalid environment variables:', ...problems].join('\n')
  }
}
