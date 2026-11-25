import type { FavoriteDto, FavoriteSnapshotDto } from './dto.ts'

export type FavoriteProps = FavoriteSnapshotDto & {
  readonly objectId: number
  readonly note: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class Favorite {
  static readonly maxNoteLength = 2000
  static readonly #diacritics = /\p{M}/gu
  static readonly #whitespace = /\s+/

  readonly objectId: number
  readonly title: string
  readonly artist: string
  readonly date: string
  readonly medium: string
  readonly department: string
  readonly imageUrl: string | null
  readonly note: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly #searchText: string

  constructor(props: FavoriteProps) {
    this.objectId = props.objectId
    this.title = props.title
    this.artist = props.artist
    this.date = props.date
    this.medium = props.medium
    this.department = props.department
    this.imageUrl = props.imageUrl
    this.note = props.note
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.#searchText = Favorite.#fold([props.title, props.artist, props.note].join('\n'))
  }

  static fromDto(dto: FavoriteDto): Favorite {
    return new Favorite({
      objectId: dto.objectId,
      title: dto.title,
      artist: dto.artist,
      date: dto.date,
      medium: dto.medium,
      department: dto.department,
      imageUrl: dto.imageUrl,
      note: dto.note,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    })
  }

  static draft(objectId: number, snapshot: FavoriteSnapshotDto, now: Date): Favorite {
    return new Favorite({ ...snapshot, objectId, note: '', createdAt: now, updatedAt: now })
  }

  get hasNote(): boolean {
    return this.note.trim() !== ''
  }

  withNote(note: string): Favorite {
    return new Favorite({ ...this.#props(), note: note.trim() })
  }

  matches(term: string): boolean {
    const words = Favorite.#fold(term).split(Favorite.#whitespace).filter((word) => word !== '')
    return words.every((word) => this.#searchText.includes(word))
  }

  #props(): FavoriteProps {
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

  static #fold(value: string): string {
    return value.normalize('NFD').replace(Favorite.#diacritics, '').toLowerCase().trim()
  }
}
