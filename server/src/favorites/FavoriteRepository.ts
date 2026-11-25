import type { Database } from '../database/Database.ts'
import type { RowReader } from '../database/RowReader.ts'

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

  readonly #database: Database

  constructor(database: Database) {
    this.#database = database
  }

  listByUser(userId: number): Promise<FavoriteRecord[]> {
    return this.#database.rows(
      {
        sql: `SELECT ${FavoriteRepository.#columns} FROM favorites
          WHERE user_id = ?
          ORDER BY created_at DESC, object_id DESC`,
        args: [userId],
      },
      FavoriteRepository.#read,
    )
  }

  find({ userId, objectId }: FavoriteKey): Promise<FavoriteRecord | null> {
    return this.#database.row(
      {
        sql: `SELECT ${FavoriteRepository.#columns} FROM favorites WHERE user_id = ? AND object_id = ?`,
        args: [userId, objectId],
      },
      FavoriteRepository.#read,
    )
  }

  insertIfAbsent(favorite: FavoriteRecord): Promise<FavoriteRecord | null> {
    return this.#database.row(
      {
        sql: `INSERT INTO favorites (${FavoriteRepository.#columns})
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT DO NOTHING
          RETURNING ${FavoriteRepository.#columns}`,
        args: [
          favorite.userId,
          favorite.objectId,
          favorite.title,
          favorite.artist,
          favorite.date,
          favorite.medium,
          favorite.department,
          favorite.imageUrl,
          favorite.note,
          favorite.createdAt,
          favorite.updatedAt,
        ],
      },
      FavoriteRepository.#read,
    )
  }

  updateNote({ userId, objectId, note, updatedAt }: NoteChange): Promise<FavoriteRecord | null> {
    return this.#database.row(
      {
        sql: `UPDATE favorites SET note = ?, updated_at = ?
          WHERE user_id = ? AND object_id = ?
          RETURNING ${FavoriteRepository.#columns}`,
        args: [note, updatedAt, userId, objectId],
      },
      FavoriteRepository.#read,
    )
  }

  async delete({ userId, objectId }: FavoriteKey): Promise<boolean> {
    const removed = await this.#database.run({
      sql: 'DELETE FROM favorites WHERE user_id = ? AND object_id = ?',
      args: [userId, objectId],
    })
    return removed > 0
  }

  static #read(row: RowReader): FavoriteRecord {
    return {
      userId: row.integer('user_id'),
      objectId: row.integer('object_id'),
      title: row.text('title'),
      artist: row.text('artist'),
      date: row.text('object_date'),
      medium: row.text('medium'),
      department: row.text('department'),
      imageUrl: row.optionalText('image_url'),
      note: row.text('note'),
      createdAt: row.text('created_at'),
      updatedAt: row.text('updated_at'),
    }
  }
}
