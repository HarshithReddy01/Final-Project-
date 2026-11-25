export type UserDto = {
  readonly id: number
  readonly username: string
  readonly createdAt: string
}

export type FavoriteSnapshotDto = {
  readonly title: string
  readonly artist: string
  readonly date: string
  readonly medium: string
  readonly department: string
  readonly imageUrl: string | null
}

export type FavoriteDto = FavoriteSnapshotDto & {
  readonly objectId: number
  readonly note: string
  readonly createdAt: string
  readonly updatedAt: string
}

export type ErrorDto = {
  readonly error: {
    readonly code: string
    readonly message: string
    readonly fields?: Readonly<Record<string, string>>
  }
}

export type SessionResponseDto = {
  readonly user: UserDto | null
}

export type SessionTokenDto = {
  readonly token: string
  readonly expiresAt: string
}

export type AuthenticationResponseDto = {
  readonly user: UserDto
  readonly session: SessionTokenDto
}

export type FavoritesResponseDto = {
  readonly favorites: readonly FavoriteDto[]
}

export type FavoriteResponseDto = {
  readonly favorite: FavoriteDto
}
