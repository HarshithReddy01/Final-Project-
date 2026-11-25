import type { Database, Statement } from '../database/Database.ts'

type FavoriteRow = {
  user_id: number
  object_id: number
  title: string
  artist: string
  object_date: string
  medium: string
  department: string
  image_url: string | null
  note: string
  created_at: string
  updated_at: string
}

export type FavoriteRecord = {
  readonly userId: number
  readonly objectId: number
  readonly title: string
  readonly artist: string
  readonly date: string
  readonly medium: string
  readonly department: string
  readonly imageUrl: string | null
  readonly note: string
  readonly createdAt: string
  readonly updatedAt: string
}

export type FavoriteKey = {
  readonly userId: number
  readonly objectId: number
}

export type NoteChange = FavoriteKey & {
  readonly note: string
  readonly updatedAt: string
}

export class FavoriteRepository {
  static readonly #columns =
    'user_id, object_id, title, artist, object_date, medium, department, image_url, note, created_at, updated_at'

  readonly #selectByUser: Statement<[number], FavoriteRow>
  readonly #selectOne: Statement<FavoriteKey, FavoriteRow>
  readonly #insert: Statement<FavoriteRecord, FavoriteRow>
  readonly #updateNote: Statement<NoteChange, FavoriteRow>
  readonly #delete: Statement<FavoriteKey>

  constructor(database: Database) {
    const columns = FavoriteRepository.#columns
    this.#selectByUser = database.prepare(`
      SELECT ${columns}
      FROM favorites
      WHERE user_id = ?
      ORDER BY created_at DESC, object_id DESC
    `)
    this.#selectOne = database.prepare(`
      SELECT ${columns}
      FROM favorites
      WHERE user_id = @userId AND object_id = @objectId
    `)
    this.#insert = database.prepare(`
      INSERT INTO favorites (${columns})
      VALUES (
        @userId, @objectId, @title, @artist, @date, @medium, @department, @imageUrl, @note, @createdAt, @updatedAt
      )
      ON CONFLICT DO NOTHING
      RETURNING ${columns}
    `)
    this.#updateNote = database.prepare(`
      UPDATE favorites
      SET note = @note, updated_at = @updatedAt
      WHERE user_id = @userId AND object_id = @objectId
      RETURNING ${columns}
    `)
    this.#delete = database.prepare('DELETE FROM favorites WHERE user_id = @userId AND object_id = @objectId')
  }

  listByUser(userId: number): FavoriteRecord[] {
    return this.#selectByUser.all(userId).map((row) => FavoriteRepository.#toRecord(row))
  }

  find(key: FavoriteKey): FavoriteRecord | null {
    return FavoriteRepository.#toNullableRecord(this.#selectOne.get(key))
  }

  insertIfAbsent(favorite: FavoriteRecord): FavoriteRecord | null {
    return FavoriteRepository.#toNullableRecord(this.#insert.get(favorite))
  }

  updateNote(change: NoteChange): FavoriteRecord | null {
    return FavoriteRepository.#toNullableRecord(this.#updateNote.get(change))
  }

  delete(key: FavoriteKey): boolean {
    return this.#delete.run(key).changes > 0
  }

  static #toNullableRecord(row: FavoriteRow | undefined): FavoriteRecord | null {
    return row === undefined ? null : FavoriteRepository.#toRecord(row)
  }

  static #toRecord(row: FavoriteRow): FavoriteRecord {
    return {
      userId: row.user_id,
      objectId: row.object_id,
      title: row.title,
      artist: row.artist,
      date: row.object_date,
      medium: row.medium,
      department: row.department,
      imageUrl: row.image_url,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
