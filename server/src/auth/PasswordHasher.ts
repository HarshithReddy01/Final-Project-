import { randomBytes } from 'node:crypto'
import bcrypt from 'bcrypt'

export class PasswordHasher {
  static readonly maxPasswordBytes = 72
  static readonly #dummyPasswordBytes = 32

  readonly #rounds: number
  #dummyHash: Promise<string> | null = null

  constructor(rounds: number) {
    this.#rounds = rounds
  }

  static fitsLimit(password: string): boolean {
    return Buffer.byteLength(password, 'utf8') <= PasswordHasher.maxPasswordBytes
  }

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.#rounds)
  }

  verify(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash)
  }

  async verifyDummy(password: string): Promise<void> {
    this.#dummyHash ??= this.hash(randomBytes(PasswordHasher.#dummyPasswordBytes).toString('base64url'))
    await this.verify(password, await this.#dummyHash)
  }
}
