import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { AppConfig } from '../src/config/AppConfig.ts'

const serverRoot = path.resolve(import.meta.dirname, '..')

describe('AppConfig.fromEnvironment', () => {
  it('falls back to the documented defaults', () => {
    const config = AppConfig.fromEnvironment({})

    expect(config).toMatchObject({
      port: 3001,
      environment: 'development',
      databasePath: path.join(serverRoot, 'data', 'vitrine.db'),
      sessionTtlMs: 14 * 24 * 60 * 60 * 1000,
      bcryptRounds: 12,
      clientDistPath: path.resolve(serverRoot, '..', 'client', 'dist'),
      authRateLimit: { windowMs: 15 * 60_000, limit: 20 },
    })
    expect(config.isProduction).toBe(false)
  })

  it('reads every variable and resolves relative paths from the server package', () => {
    const clientDistPath = path.join(tmpdir(), 'vitrine-client')

    const config = AppConfig.fromEnvironment({
      PORT: '4000',
      NODE_ENV: 'production',
      DATABASE_PATH: './data/catalogue.db',
      SESSION_TTL_DAYS: '30',
      BCRYPT_ROUNDS: '10',
      CLIENT_DIST_PATH: clientDistPath,
    })

    expect(config).toMatchObject({
      port: 4000,
      environment: 'production',
      databasePath: path.join(serverRoot, 'data', 'catalogue.db'),
      sessionTtlMs: 30 * 24 * 60 * 60 * 1000,
      bcryptRounds: 10,
      clientDistPath,
    })
    expect(config.isProduction).toBe(true)
  })

  it('passes an in-memory database through untouched', () => {
    expect(AppConfig.fromEnvironment({ DATABASE_PATH: ':memory:' }).databasePath).toBe(':memory:')
  })

  it('lists every invalid variable in one error', () => {
    const readInvalidEnvironment = () =>
      AppConfig.fromEnvironment({
        PORT: 'eighty',
        NODE_ENV: 'staging',
        SESSION_TTL_DAYS: '365',
        BCRYPT_ROUNDS: '3',
      })
    const expectedLines = [
      '^Invalid environment variables:',
      ' {2}PORT: .+',
      ' {2}NODE_ENV: .+',
      ' {2}SESSION_TTL_DAYS: .+',
      ' {2}BCRYPT_ROUNDS: .+$',
    ]

    expect(readInvalidEnvironment).toThrow(new RegExp(expectedLines.join('\n')))
  })
})
