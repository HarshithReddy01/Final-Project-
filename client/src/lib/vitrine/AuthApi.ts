import type { HttpClient } from '../http/HttpClient.ts'
import type { SessionResponseDto, UserResponseDto } from './dto.ts'
import { User } from './User.ts'

export type Credentials = {
  readonly username: string
  readonly password: string
}

export class AuthApi {
  readonly #http: HttpClient

  constructor(http: HttpClient) {
    this.#http = http
  }

  async getSession(signal?: AbortSignal): Promise<User | null> {
    const { user } = await this.#http.get<SessionResponseDto>('/auth/session', { signal })
    return user === null ? null : User.fromDto(user)
  }

  async signIn(credentials: Credentials): Promise<User> {
    const { user } = await this.#http.post<UserResponseDto>('/auth/login', credentials)
    return User.fromDto(user)
  }

  async register(credentials: Credentials): Promise<User> {
    const { user } = await this.#http.post<UserResponseDto>('/auth/register', credentials)
    return User.fromDto(user)
  }

  async signOut(): Promise<void> {
    await this.#http.post('/auth/logout')
  }
}
