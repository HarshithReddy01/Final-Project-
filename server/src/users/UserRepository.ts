import type { Database, Statement } from '../database/Database.ts'

type UserRow = {
  id: number
  username: string
  password_hash: string
  created_at: string
}

export type UserRecord = {
  readonly id: number
  readonly username: string
  readonly passwordHash: string
  readonly createdAt: string
}

export type NewUser = Omit<UserRecord, 'id'>

export class UserRepository {
  static readonly #columns = 'id, username, password_hash, created_at'

  readonly #insert: Statement<NewUser, UserRow>
  readonly #selectById: Statement<[number], UserRow>
  readonly #selectByUsername: Statement<[string], UserRow>

  constructor(database: Database) {
    const columns = UserRepository.#columns
    this.#insert = database.prepare(`
      INSERT INTO users (username, password_hash, created_at)
      VALUES (@username, @passwordHash, @createdAt)
      ON CONFLICT DO NOTHING
      RETURNING ${columns}
    `)
    this.#selectById = database.prepare(`SELECT ${columns} FROM users WHERE id = ?`)
    this.#selectByUsername = database.prepare(`SELECT ${columns} FROM users WHERE username = ?`)
  }

  insertIfAbsent(user: NewUser): UserRecord | null {
    return UserRepository.#toRecord(this.#insert.get(user))
  }

  findById(id: number): UserRecord | null {
    return UserRepository.#toRecord(this.#selectById.get(id))
  }

  findByUsername(username: string): UserRecord | null {
    return UserRepository.#toRecord(this.#selectByUsername.get(username))
  }

  static #toRecord(row: UserRow | undefined): UserRecord | null {
    if (row === undefined) return null
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
    }
  }
}
