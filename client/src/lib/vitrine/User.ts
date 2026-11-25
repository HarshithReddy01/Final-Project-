import type { UserDto } from './dto.ts'

export class User {
  readonly id: number
  readonly username: string
  readonly createdAt: Date

  constructor(id: number, username: string, createdAt: Date) {
    this.id = id
    this.username = username
    this.createdAt = createdAt
  }

  static fromDto(dto: UserDto): User {
    return new User(dto.id, dto.username, new Date(dto.createdAt))
  }
}
