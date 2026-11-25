import type { Credentials } from '../../lib/vitrine/AuthApi.ts'

export type AuthMode = 'sign-in' | 'register'

export type CredentialErrors = {
  readonly username?: string
  readonly password?: string
}

export class CredentialRules {
  static readonly #usernamePattern = /^[A-Za-z0-9_.-]+$/
  static readonly #usernameLength = { min: 3, max: 32 }
  static readonly #passwordMinLength = 8
  static readonly #passwordMaxBytes = 72

  static check(mode: AuthMode, { username, password }: Credentials): CredentialErrors {
    const name = username.trim()
    const usernameProblem =
      mode === 'register' ? CredentialRules.#newUsernameProblem(name) : CredentialRules.#required(name, 'username')
    const passwordProblem =
      mode === 'register' ? CredentialRules.#newPasswordProblem(password) : CredentialRules.#required(password, 'password')
    return {
      ...(usernameProblem === null ? {} : { username: usernameProblem }),
      ...(passwordProblem === null ? {} : { password: passwordProblem }),
    }
  }

  static hasProblems(errors: CredentialErrors): boolean {
    return errors.username !== undefined || errors.password !== undefined
  }

  static #required(value: string, field: keyof Credentials): string | null {
    return value === '' ? `Enter your ${field}.` : null
  }

  static #newUsernameProblem(username: string): string | null {
    const { min, max } = CredentialRules.#usernameLength
    if (username === '') return 'Enter a username.'
    if (username.length < min) return `Use at least ${min} characters.`
    if (username.length > max) return `Use at most ${max} characters.`
    if (!CredentialRules.#usernamePattern.test(username)) return 'Use letters, numbers, dots, dashes or underscores.'
    return null
  }

  static #newPasswordProblem(password: string): string | null {
    if (password === '') return 'Enter a password.'
    if (password.length < CredentialRules.#passwordMinLength) {
      return `Use at least ${CredentialRules.#passwordMinLength} characters.`
    }
    if (new TextEncoder().encode(password).length > CredentialRules.#passwordMaxBytes) {
      return `Use at most ${CredentialRules.#passwordMaxBytes} bytes.`
    }
    return null
  }
}
