import type { Response } from 'express'
import { User } from '../users/User.ts'
import { HttpError } from './HttpError.ts'

export class RequestContext {
  static setUser(response: Response, user: User | null): void {
    response.locals.user = user
  }

  static getUser(response: Response): User | null {
    const user: unknown = response.locals.user
    return user instanceof User ? user : null
  }

  static requireUser(response: Response): User {
    const user = RequestContext.getUser(response)
    if (user === null) throw HttpError.unauthorized()
    return user
  }
}
