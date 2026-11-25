import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@libsql/client'
import type { Client, InStatement } from '@libsql/client'
import type { Migration } from './migrations.ts'
import { RowReader } from './RowReader.ts'

export type DatabaseLocation = {
  readonly url: string
  readonly authToken?: string | undefined
}

export type SqlValue = string | number | null

export type SqlStatement = {
  readonly sql: string
  readonly args?: readonly SqlValue[]
}

export class Database {
  static readonly inMemory = ':memory:'
  static readonly #localScheme = 'file:'
  static readonly #createMigrationsTable =
    'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)'
  static readonly #recordMigration =
    "INSERT INTO schema_migrations (version, applied_at) VALUES (?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"

  readonly #client: Client

  constructor({ url, authToken }: DatabaseLocation) {
    if (url.startsWith(Database.#localScheme)) mkdirSync(path.dirname(fileURLToPath(url)), { recursive: true })
    this.#client = createClient(authToken === undefined ? { url } : { url, authToken })
  }

  get isClosed(): boolean {
    return this.#client.closed
  }

  async migrate(migrations: readonly Migration[]): Promise<void> {
    await this.run({ sql: Database.#createMigrationsTable })
    const applied = new Set(
      await this.rows({ sql: 'SELECT version FROM schema_migrations' }, (row) => row.integer('version')),
    )
    const pending = migrations
      .filter((migration) => !applied.has(migration.version))
      .toSorted((first, second) => first.version - second.version)
    for (const migration of pending) {
      await this.batch([
        ...migration.statements.map((sql) => ({ sql })),
        { sql: Database.#recordMigration, args: [migration.version] },
      ])
    }
  }

  async rows<Result>(statement: SqlStatement, read: (row: RowReader) => Result): Promise<Result[]> {
    const result = await this.#client.execute(Database.#toLibsql(statement))
    return result.rows.map((row) => read(new RowReader(row)))
  }

  async row<Result>(statement: SqlStatement, read: (row: RowReader) => Result): Promise<Result | null> {
    const [first] = await this.rows(statement, read)
    return first ?? null
  }

  async run(statement: SqlStatement): Promise<number> {
    const result = await this.#client.execute(Database.#toLibsql(statement))
    return result.rowsAffected
  }

  async batch(statements: readonly SqlStatement[]): Promise<void> {
    await this.#client.batch(
      statements.map((statement) => Database.#toLibsql(statement)),
      'write',
    )
  }

  close(): void {
    this.#client.close()
  }

  static #toLibsql({ sql, args = [] }: SqlStatement): InStatement {
    return { sql, args: [...args] }
  }
}
