import { createHash, randomBytes } from 'node:crypto'

export type IssuedToken = {
  readonly token: string
  readonly tokenHash: string
}

export class SessionTokens {
  static readonly #tokenBytes = 32

  create(): IssuedToken {
    const token = randomBytes(SessionTokens.#tokenBytes).toString('base64url')
    return { token, tokenHash: this.hash(token) }
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }
}
