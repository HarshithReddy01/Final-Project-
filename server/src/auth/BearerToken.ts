import type { Request } from 'express'

export class BearerToken {
  static readonly #pattern = /^Bearer +([\w.~+/-]{1,256}=*)$/i

  static read(request: Request): string | null {
    const header = request.get('Authorization')
    if (header === undefined) return null
    return BearerToken.#pattern.exec(header.trim())?.[1] ?? null
  }
}
