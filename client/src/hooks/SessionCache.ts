import type { QueryClient } from '@tanstack/react-query'
import type { User } from '../lib/vitrine/User.ts'
import { QueryKeys } from './QueryKeys.ts'

export class SessionCache {
  readonly #client: QueryClient

  constructor(client: QueryClient) {
    this.#client = client
  }

  signedIn(user: User): void {
    this.#client.setQueryData<User | null>(QueryKeys.session, user)
    void this.#client.invalidateQueries({ queryKey: QueryKeys.favorites })
  }

  signedOut(): void {
    this.#client.setQueryData<User | null>(QueryKeys.session, null)
    this.#client.removeQueries({ queryKey: QueryKeys.favorites })
  }
}
