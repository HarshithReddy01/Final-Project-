import type { Database } from '../database/Database.ts'
import type { RowReader } from '../database/RowReader.ts'

export type UserRecord = {
  readonly id: number
  readonly username: string
  readonly passwordHash: string
  readonly createdAt: string
}

export type NewUser = Omit<UserRecord, 'id'>

export class UserRepository {
  static readonly #columns = 'users.id, users.username, users.password_hash, users.created_at'

  readonly #database: Database

  constructor(database: Database) {
    this.#database = database
  }

  insertIfAbsent({ username, passwordHash, createdAt }: NewUser): Promise<UserRecord | null> {
    return this.#database.row(
      {
        sql: `INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)
          ON CONFLICT DO NOTHING
          RETURNING ${UserRepository.#columns}`,
        args: [username, passwordHash, createdAt],
      },
      UserRepository.#read,
    )
  }

  findByUsername(username: string): Promise<UserRecord | null> {
    return this.#database.row(
      { sql: `SELECT ${UserRepository.#columns} FROM users WHERE users.username = ?`, args: [username] },
      UserRepository.#read,
    )
  }

  findBySession(tokenHash: string, now: string): Promise<UserRecord | null> {
    return this.#database.row(
      {
        sql: `SELECT ${UserRepository.#columns}
          FROM sessions JOIN users ON users.id = sessions.user_id
          WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
        args: [tokenHash, now],
      },
      UserRepository.#read,
    )
  }

  static #read(row: RowReader): UserRecord {
    return {
      id: row.integer('id'),
      username: row.text('username'),
      passwordHash: row.text('password_hash'),
      createdAt: row.text('created_at'),
    }
  }
}
