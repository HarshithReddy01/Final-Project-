import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Database } from '../src/database/Database.ts'
import { migrations } from '../src/database/migrations.ts'

const listTables = (database: Database) =>
  database.rows({ sql: "SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name" }, (row) =>
    row.text('name'),
  )

const listVersions = (database: Database) =>
  database.rows({ sql: 'SELECT version FROM schema_migrations ORDER BY version' }, (row) => row.integer('version'))

describe('Database.migrate', () => {
  let database: Database

  beforeEach(() => {
    database = new Database({ url: Database.inMemory })
  })

  afterEach(() => {
    database.close()
  })

  it('creates the schema and records each version once, however often it runs', async () => {
    await database.migrate(migrations)
    await database.migrate(migrations)

    expect(await listTables(database)).toEqual(['favorites', 'schema_migrations', 'sessions', 'users'])
    expect(await listVersions(database)).toEqual(migrations.map((migration) => migration.version))
  })

  it('applies only the migrations it has not seen', async () => {
    await database.migrate(migrations)

    await database.migrate([...migrations, { version: 2, statements: ['CREATE TABLE archive (id INTEGER PRIMARY KEY)'] }])

    expect(await listTables(database)).toContain('archive')
    expect(await listVersions(database)).toEqual([1, 2])
  })

  it('rolls back a migration that fails part way through', async () => {
    const broken = { version: 1, statements: ['CREATE TABLE first (id INTEGER PRIMARY KEY)', 'CREATE TABLE broken ('] }

    await expect(database.migrate([broken])).rejects.toThrow()

    expect(await listTables(database)).toEqual(['schema_migrations'])
    expect(await listVersions(database)).toEqual([])
  })
})

describe('RowReader', () => {
  let database: Database

  beforeEach(() => {
    database = new Database({ url: Database.inMemory })
  })

  afterEach(() => {
    database.close()
  })

  it('reads text, nullable text and integers', async () => {
    const row = await database.row({ sql: "SELECT 'Sunflowers' AS title, NULL AS image, 436524 AS id" }, (reader) => ({
      title: reader.text('title'),
      image: reader.optionalText('image'),
      id: reader.integer('id'),
    }))

    expect(row).toEqual({ title: 'Sunflowers', image: null, id: 436_524 })
  })

  it('refuses values of the wrong type or missing columns', async () => {
    await expect(database.row({ sql: "SELECT 'x' AS id" }, (row) => row.integer('id'))).rejects.toThrow(
      'Column "id" is not an integer',
    )
    await expect(database.row({ sql: 'SELECT 1 AS title' }, (row) => row.text('title'))).rejects.toThrow(
      'Column "title" is not text',
    )
    await expect(database.row({ sql: 'SELECT 1 AS present' }, (row) => row.text('absent'))).rejects.toThrow(
      'Column "absent" is missing from the result',
    )
  })

  it('returns null when a query finds nothing', async () => {
    const row = await database.row({ sql: 'SELECT 1 AS one WHERE 0' }, (reader) => reader.integer('one'))

    expect(row).toBeNull()
  })
})
