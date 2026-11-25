import type { AccessTokenSource } from '../http/HttpClient.ts'

export type TokenStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export class SessionTokenStore implements AccessTokenSource {
  static readonly storageKey = 'vitrine.session'

  #storage: TokenStorage | null
  #token: string | null

  constructor(storage: TokenStorage | null = SessionTokenStore.#browserStorage()) {
    this.#storage = storage
    this.#token = this.#read()
  }

  get token(): string | null {
    return this.#token
  }

  save(token: string): void {
    this.#token = token
    this.#write((storage) => storage.setItem(SessionTokenStore.storageKey, token))
  }

  clear(): void {
    this.#token = null
    this.#write((storage) => storage.removeItem(SessionTokenStore.storageKey))
  }

  #read(): string | null {
    try {
      const stored = this.#storage?.getItem(SessionTokenStore.storageKey) ?? null
      return stored === '' ? null : stored
    } catch {
      this.#storage = null
      return null
    }
  }

  #write(change: (storage: TokenStorage) => void): void {
    if (this.#storage === null) return
    try {
      change(this.#storage)
    } catch {
      this.#storage = null
    }
  }

  static #browserStorage(): TokenStorage | null {
    if (typeof window === 'undefined') return null
    try {
      return window.localStorage
    } catch {
      return null
    }
  }
}
