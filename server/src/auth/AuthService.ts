import type { Database } from '../database/Database.ts'
import { HttpError } from '../http/HttpError.ts'
import type { Clock } from '../shared/Clock.ts'
import { User } from '../users/User.ts'
import type { UserRepository } from '../users/UserRepository.ts'
import type { PasswordHasher } from './PasswordHasher.ts'
import type { SessionRepository } from './SessionRepository.ts'
import type { SessionTokens } from './SessionTokens.ts'

export type Credentials = {
  readonly username: string
  readonly password: string
}

export type IssuedSession = {
  readonly token: string
  readonly expiresAt: Date
}

export type Authentication = {
  readonly user: User
  readonly session: IssuedSession
}

export type AuthServiceDependencies = {
  readonly database: Database
  readonly users: UserRepository
  readonly sessions: SessionRepository
  readonly hasher: PasswordHasher
  readonly tokens: SessionTokens
  readonly clock: Clock
  readonly sessionTtlMs: number
}

export class AuthService {
  readonly #database: Database
  readonly #users: UserRepository
  readonly #sessions: SessionRepository
  readonly #hasher: PasswordHasher
  readonly #tokens: SessionTokens
  readonly #clock: Clock
  readonly #sessionTtlMs: number

  constructor(dependencies: AuthServiceDependencies) {
    this.#database = dependencies.database
    this.#users = dependencies.users
    this.#sessions = dependencies.sessions
    this.#hasher = dependencies.hasher
    this.#tokens = dependencies.tokens
    this.#clock = dependencies.clock
    this.#sessionTtlMs = dependencies.sessionTtlMs
  }

  async register({ username, password }: Credentials): Promise<Authentication> {
    if (this.#users.findByUsername(username) !== null) throw HttpError.usernameTaken()
    const passwordHash = await this.#hasher.hash(password)
    return this.#database.transaction(() => {
      const record = this.#users.insertIfAbsent({ username, passwordHash, createdAt: this.#clock.now().toISOString() })
      if (record === null) throw HttpError.usernameTaken()
      return this.#startSession(User.fromRecord(record))
    })
  }

  async login({ username, password }: Credentials): Promise<Authentication> {
    const record = this.#users.findByUsername(username)
    if (record === null) {
      await this.#hasher.verifyDummy(password)
      throw HttpError.invalidCredentials()
    }
    const passwordMatches = await this.#hasher.verify(password, record.passwordHash)
    if (!passwordMatches) throw HttpError.invalidCredentials()
    return this.#startSession(User.fromRecord(record))
  }

  resolveSession(token: string): User | null {
    const session = this.#sessions.findActive(this.#tokens.hash(token), this.#clock.now().toISOString())
    if (session === null) return null
    const record = this.#users.findById(session.userId)
    return record === null ? null : User.fromRecord(record)
  }

  logout(token: string): void {
    this.#sessions.delete(this.#tokens.hash(token))
  }

  #startSession(user: User): Authentication {
    const now = this.#clock.now()
    const expiresAt = new Date(now.getTime() + this.#sessionTtlMs)
    const { token, tokenHash } = this.#tokens.create()
    this.#sessions.deleteExpired(now.toISOString())
    this.#sessions.create({
      tokenHash,
      userId: user.id,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })
    return { user, session: { token, expiresAt } }
  }
}
