import type { Database } from '../database/Database.ts'

export type SessionRecord = {
  readonly tokenHash: string
  readonly userId: number
  readonly createdAt: string
  readonly expiresAt: string
}

export class SessionRepository {
  readonly #database: Database

  constructor(database: Database) {
    this.#database = database
  }

  async create({ tokenHash, userId, createdAt, expiresAt }: SessionRecord): Promise<void> {
    await this.#database.run({
      sql: 'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
      args: [tokenHash, userId, createdAt, expiresAt],
    })
  }

  async delete(tokenHash: string): Promise<void> {
    await this.#database.run({ sql: 'DELETE FROM sessions WHERE token_hash = ?', args: [tokenHash] })
  }

  async deleteExpired(now: string): Promise<void> {
    await this.#database.run({ sql: 'DELETE FROM sessions WHERE expires_at <= ?', args: [now] })
  }
}
