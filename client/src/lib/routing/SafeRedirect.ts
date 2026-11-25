export class SafeRedirect {
  static readonly #base = new URL('https://vitrine.invalid')

  static resolve(next: string | null | undefined, fallback = '/'): string {
    if (!next?.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
    const url = SafeRedirect.#parse(next)
    if (url === null || url.origin !== SafeRedirect.#base.origin) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  }

  static #parse(path: string): URL | null {
    try {
      return new URL(path, SafeRedirect.#base)
    } catch {
      return null
    }
  }
}
