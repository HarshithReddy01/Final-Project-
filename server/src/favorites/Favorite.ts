import type { FavoriteRecord } from './FavoriteRepository.ts'

export type FavoriteSnapshotDto = {
  title: string
  artist: string
  date: string
  medium: string
  department: string
  imageUrl: string | null
}

export type FavoriteDto = FavoriteSnapshotDto & {
  objectId: number
  note: string
  createdAt: string
  updatedAt: string
}

export class Favorite {
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

  constructor(properties: FavoriteDto) {
    this.objectId = properties.objectId
    this.title = properties.title
    this.artist = properties.artist
    this.date = properties.date
    this.medium = properties.medium
    this.department = properties.department
    this.imageUrl = properties.imageUrl
    this.note = properties.note
    this.createdAt = properties.createdAt
    this.updatedAt = properties.updatedAt
  }

  static fromRecord(record: FavoriteRecord): Favorite {
    return new Favorite(record)
  }

  toJSON(): FavoriteDto {
    return {
      objectId: this.objectId,
      title: this.title,
      artist: this.artist,
      date: this.date,
      medium: this.medium,
      department: this.department,
      imageUrl: this.imageUrl,
      note: this.note,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
