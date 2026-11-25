import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { AppConfig } from '../src/config/AppConfig.ts'

const serverRoot = path.resolve(import.meta.dirname, '..')
const pagesOrigin = 'https://harshithreddy01.github.io'

describe('AppConfig.fromEnvironment', () => {
  it('falls back to the documented defaults', () => {
    const config = AppConfig.fromEnvironment({})

    expect(config).toMatchObject({
      port: 3001,
      environment: 'development',
      database: { url: pathToFileURL(path.join(serverRoot, 'data', 'vitrine.db')).href },
      sessionTtlMs: 14 * 24 * 60 * 60 * 1000,
      bcryptRounds: 12,
      clientDistPath: path.resolve(serverRoot, '..', 'client', 'dist'),
      allowedOrigins: ['http://localhost:5173', 'http://localhost:4173'],
      trustProxy: false,
      authRateLimit: { windowMs: 15 * 60_000, limit: 20 },
    })
    expect(config.database.authToken).toBeUndefined()
    expect(config.isProduction).toBe(false)
  })

  it('reads every variable of a production deployment', () => {
    const clientDistPath = path.join(tmpdir(), 'vitrine-client')

    const config = AppConfig.fromEnvironment({
      PORT: '10000',
      NODE_ENV: 'production',
      TURSO_DATABASE_URL: 'libsql://vitrine-example.aws-us-east-1.turso.io',
      TURSO_AUTH_TOKEN: 'example-token',
      SESSION_TTL_DAYS: '30',
      BCRYPT_ROUNDS: '10',
      CLIENT_DIST_PATH: clientDistPath,
      ALLOWED_ORIGINS: `${pagesOrigin}, http://localhost:5173`,
      TRUST_PROXY: '2',
    })

    expect(config).toMatchObject({
      port: 10_000,
      environment: 'production',
      database: { url: 'libsql://vitrine-example.aws-us-east-1.turso.io', authToken: 'example-token' },
      sessionTtlMs: 30 * 24 * 60 * 60 * 1000,
      bcryptRounds: 10,
      clientDistPath,
      allowedOrigins: [pagesOrigin, 'http://localhost:5173'],
      trustProxy: 2,
    })
    expect(config.isProduction).toBe(true)
  })

  it('trusts one proxy hop in production unless told otherwise', () => {
    const defaults = AppConfig.fromEnvironment({ NODE_ENV: 'production', ALLOWED_ORIGINS: pagesOrigin })
    const disabled = AppConfig.fromEnvironment({ NODE_ENV: 'production', ALLOWED_ORIGINS: pagesOrigin, TRUST_PROXY: 'false' })

    expect(defaults.trustProxy).toBe(1)
    expect(disabled.trustProxy).toBe(false)
  })

  it('requires the allowed origins in production', () => {
    expect(() => AppConfig.fromEnvironment({ NODE_ENV: 'production' })).toThrow(
      /ALLOWED_ORIGINS: Required in production/,
    )
  })

  it.each([`${pagesOrigin}/`, `${pagesOrigin}/Final-Project-`, 'github.io', ' , '])(
    'rejects the origin list %j',
    (value) => {
      expect(() => AppConfig.fromEnvironment({ ALLOWED_ORIGINS: value })).toThrow(/ALLOWED_ORIGINS/)
    },
  )

  it('resolves a local database path from the server package and ignores a token for it', () => {
    const config = AppConfig.fromEnvironment({ TURSO_DATABASE_URL: 'data/qa.db', TURSO_AUTH_TOKEN: 'example-token' })

    expect(config.database).toEqual({ url: pathToFileURL(path.join(serverRoot, 'data', 'qa.db')).href })
  })

  it('passes in-memory databases and file URLs through untouched', () => {
    const fileUrl = pathToFileURL(path.join(tmpdir(), 'vitrine.db')).href

    expect(AppConfig.fromEnvironment({ TURSO_DATABASE_URL: ':memory:' }).database).toEqual({ url: ':memory:' })
    expect(AppConfig.fromEnvironment({ TURSO_DATABASE_URL: fileUrl }).database).toEqual({ url: fileUrl })
  })

  it('lists every invalid variable in one error', () => {
    const readInvalidEnvironment = () =>
      AppConfig.fromEnvironment({
        PORT: 'eighty',
        NODE_ENV: 'staging',
        SESSION_TTL_DAYS: '365',
        BCRYPT_ROUNDS: '3',
        TRUST_PROXY: 'yes',
      })
    const expectedLines = [
      '^Invalid environment variables:',
      ' {2}PORT: .+',
      ' {2}NODE_ENV: .+',
      ' {2}SESSION_TTL_DAYS: .+',
      ' {2}BCRYPT_ROUNDS: .+',
      ' {2}TRUST_PROXY: .+$',
    ]

    expect(readInvalidEnvironment).toThrow(new RegExp(expectedLines.join('\n')))
  })
})
