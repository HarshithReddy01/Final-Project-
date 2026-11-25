import type { HttpClient } from '../http/HttpClient.ts'
import type { AuthenticationResponseDto, SessionResponseDto } from './dto.ts'
import type { SessionTokenStore } from './SessionTokenStore.ts'
import { User } from './User.ts'

export type Credentials = {
  readonly username: string
  readonly password: string
}

export class AuthApi {
  readonly #http: HttpClient
  readonly #tokens: SessionTokenStore

  constructor(http: HttpClient, tokens: SessionTokenStore) {
    this.#http = http
    this.#tokens = tokens
  }

  async getSession(signal?: AbortSignal): Promise<User | null> {
    if (this.#tokens.token === null) return null
    const { user } = await this.#http.get<SessionResponseDto>('/auth/session', { signal })
    if (user !== null) return User.fromDto(user)
    this.#tokens.clear()
    return null
  }

  signIn(credentials: Credentials): Promise<User> {
    return this.#authenticate('/auth/login', credentials)
  }

  register(credentials: Credentials): Promise<User> {
    return this.#authenticate('/auth/register', credentials)
  }

  async signOut(): Promise<void> {
    try {
      if (this.#tokens.token !== null) await this.#http.post('/auth/logout')
    } finally {
      this.#tokens.clear()
    }
  }

  forgetSession(): void {
    this.#tokens.clear()
  }

  async #authenticate(path: string, credentials: Credentials): Promise<User> {
    const { user, session } = await this.#http.post<AuthenticationResponseDto>(path, credentials)
    this.#tokens.save(session.token)
    return User.fromDto(user)
  }
}
