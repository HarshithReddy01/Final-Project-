import type { Database, Statement } from '../database/Database.ts'

type SessionRow = {
  token_hash: string
  user_id: number
  created_at: string
  expires_at: string
}

export type SessionRecord = {
  readonly tokenHash: string
  readonly userId: number
  readonly createdAt: string
  readonly expiresAt: string
}

type ActiveSessionQuery = {
  readonly tokenHash: string
  readonly now: string
}

export class SessionRepository {
  readonly #insert: Statement<SessionRecord>
  readonly #selectActive: Statement<ActiveSessionQuery, SessionRow>
  readonly #delete: Statement<[string]>
  readonly #deleteExpired: Statement<[string]>

  constructor(database: Database) {
    this.#insert = database.prepare(`
      INSERT INTO sessions (token_hash, user_id, created_at, expires_at)
      VALUES (@tokenHash, @userId, @createdAt, @expiresAt)
    `)
    this.#selectActive = database.prepare(`
      SELECT token_hash, user_id, created_at, expires_at
      FROM sessions
      WHERE token_hash = @tokenHash AND expires_at > @now
    `)
    this.#delete = database.prepare('DELETE FROM sessions WHERE token_hash = ?')
    this.#deleteExpired = database.prepare('DELETE FROM sessions WHERE expires_at <= ?')
  }

  create(session: SessionRecord): void {
    this.#insert.run(session)
  }

  findActive(tokenHash: string, now: string): SessionRecord | null {
    const row = this.#selectActive.get({ tokenHash, now })
    if (row === undefined) return null
    return {
      tokenHash: row.token_hash,
      userId: row.user_id,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }
  }

  delete(tokenHash: string): void {
    this.#delete.run(tokenHash)
  }

  deleteExpired(now: string): void {
    this.#deleteExpired.run(now)
  }
}
