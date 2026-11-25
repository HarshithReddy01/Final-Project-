import { describe, expect, it } from 'vitest'
import { SessionTokenStore, type TokenStorage } from './SessionTokenStore.ts'

class MemoryStorage implements TokenStorage {
  readonly items = new Map<string, string>()

  getItem(key: string): string | null {
    return this.items.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value)
  }

  removeItem(key: string): void {
    this.items.delete(key)
  }
}

class BrokenStorage implements TokenStorage {
  getItem(): string | null {
    throw new Error('Storage is disabled')
  }

  setItem(): void {
    throw new Error('Storage is disabled')
  }

  removeItem(): void {
    throw new Error('Storage is disabled')
  }
}

describe('SessionTokenStore', () => {
  it('restores a token saved by an earlier visit', () => {
    const storage = new MemoryStorage()
    storage.setItem(SessionTokenStore.storageKey, 'abc')

    expect(new SessionTokenStore(storage).token).toBe('abc')
  })

  it('saves and clears the token in storage', () => {
    const storage = new MemoryStorage()
    const store = new SessionTokenStore(storage)

    store.save('abc')
    const saved = storage.getItem(SessionTokenStore.storageKey)
    store.clear()

    expect(saved).toBe('abc')
    expect(store.token).toBeNull()
    expect(storage.items.size).toBe(0)
  })

  it('treats an empty stored value as no token', () => {
    const storage = new MemoryStorage()
    storage.setItem(SessionTokenStore.storageKey, '')

    expect(new SessionTokenStore(storage).token).toBeNull()
  })

  it('keeps working in memory when storage is unavailable', () => {
    const store = new SessionTokenStore(new BrokenStorage())

    store.save('abc')
    const saved = store.token
    store.clear()

    expect(saved).toBe('abc')
    expect(store.token).toBeNull()
  })

  it('works without any storage at all', () => {
    const store = new SessionTokenStore(null)

    store.save('abc')

    expect(store.token).toBe('abc')
  })
})
