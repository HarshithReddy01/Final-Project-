import { mkdirSync } from 'node:fs'
import path from 'node:path'
import BetterSqlite3 from 'better-sqlite3'
import type { Migration } from './migrations.ts'

export type Statement<Params extends unknown[] | object = unknown[], Row = unknown> =
  BetterSqlite3.Statement<Params, Row>

export class Database {
  static readonly inMemory = ':memory:'
  static readonly #busyTimeoutMs = 5000

  readonly #connection: BetterSqlite3.Database

  constructor(filename: string) {
    const isFile = filename !== Database.inMemory
    if (isFile) mkdirSync(path.dirname(filename), { recursive: true })
    this.#connection = new BetterSqlite3(filename)
    if (isFile) this.#connection.pragma('journal_mode = WAL')
    this.#connection.pragma('foreign_keys = ON')
    this.#connection.pragma(`busy_timeout = ${Database.#busyTimeoutMs}`)
  }

  migrate(migrations: readonly Migration[]): void {
    const appliedVersion = Number(this.#connection.pragma('user_version', { simple: true }))
    const pending = migrations
      .filter((migration) => migration.version > appliedVersion)
      .toSorted((first, second) => first.version - second.version)
    for (const migration of pending) {
      this.transaction(() => {
        this.#connection.exec(migration.sql)
        this.#connection.pragma(`user_version = ${migration.version}`)
      })
    }
  }

  prepare<Params extends unknown[] | object = unknown[], Row = unknown>(sql: string): Statement<Params, Row> {
    return this.#connection.prepare<Params, Row>(sql)
  }

  transaction<Result>(work: () => Result): Result {
    return this.#connection.transaction(work)()
  }

  close(): void {
    this.#connection.close()
  }
}
