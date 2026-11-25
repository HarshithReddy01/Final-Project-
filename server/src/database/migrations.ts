export type Migration = {
  readonly version: number
  readonly statements: readonly string[]
}

export const migrations: readonly Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE sessions (
        token_hash TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )`,
      'CREATE INDEX sessions_user_id_idx ON sessions (user_id)',
      'CREATE INDEX sessions_expires_at_idx ON sessions (expires_at)',
      `CREATE TABLE favorites (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        object_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        artist TEXT NOT NULL DEFAULT '',
        object_date TEXT NOT NULL DEFAULT '',
        medium TEXT NOT NULL DEFAULT '',
        department TEXT NOT NULL DEFAULT '',
        image_url TEXT,
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, object_id)
      ) WITHOUT ROWID`,
      'CREATE INDEX favorites_user_id_created_at_idx ON favorites (user_id, created_at)',
    ],
  },
]
