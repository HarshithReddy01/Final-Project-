import type { CookieOptions, Request, Response } from 'express'

export type SessionCookieOptions = {
  readonly secure: boolean
}

export class SessionCookie {
  static readonly cookieName = 'vitrine_session'

  readonly #attributes: CookieOptions

  constructor({ secure }: SessionCookieOptions) {
    this.#attributes = { httpOnly: true, sameSite: 'lax', secure, path: '/' }
  }

  read(request: Request): string | null {
    const value: unknown = request.cookies[SessionCookie.cookieName]
    return typeof value === 'string' && value !== '' ? value : null
  }

  write(response: Response, token: string, expiresAt: Date): void {
    response.cookie(SessionCookie.cookieName, token, { ...this.#attributes, expires: expiresAt })
  }

  clear(response: Response): void {
    response.clearCookie(SessionCookie.cookieName, this.#attributes)
  }
}
