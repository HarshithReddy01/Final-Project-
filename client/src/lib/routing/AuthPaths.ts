import { SafeRedirect } from './SafeRedirect.ts'

export type PathLocation = {
  readonly pathname: string
  readonly search: string
}

export class AuthPaths {
  static readonly signInPath = '/sign-in'
  static readonly registerPath = '/register'
  static readonly nextParam = 'next'

  static signIn(next = '/'): string {
    return AuthPaths.#withNext(AuthPaths.signInPath, next)
  }

  static register(next = '/'): string {
    return AuthPaths.#withNext(AuthPaths.registerPath, next)
  }

  static nextFrom(params: URLSearchParams): string {
    return SafeRedirect.resolve(params.get(AuthPaths.nextParam))
  }

  static returnTo(location: PathLocation): string {
    if (AuthPaths.isAuthPath(location.pathname)) return AuthPaths.nextFrom(new URLSearchParams(location.search))
    return SafeRedirect.resolve(`${location.pathname}${location.search}`)
  }

  static isAuthPath(pathname: string): boolean {
    return pathname === AuthPaths.signInPath || pathname === AuthPaths.registerPath
  }

  static #withNext(path: string, next: string): string {
    const target = SafeRedirect.resolve(next)
    if (target === '/') return path
    return `${path}?${new URLSearchParams({ [AuthPaths.nextParam]: target }).toString()}`
  }
}
