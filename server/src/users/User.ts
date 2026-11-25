import type { UserRecord } from './UserRepository.ts'

export type UserDto = {
  id: number
  username: string
  createdAt: string
}

export class User {
  readonly id: number
  readonly username: string
  readonly createdAt: string

  constructor({ id, username, createdAt }: UserDto) {
    this.id = id
    this.username = username
    this.createdAt = createdAt
  }

  static fromRecord(record: UserRecord): User {
    return new User({ id: record.id, username: record.username, createdAt: record.createdAt })
  }

  toJSON(): UserDto {
    return { id: this.id, username: this.username, createdAt: this.createdAt }
  }
}
