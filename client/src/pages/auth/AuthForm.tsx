import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { Button } from '../../components/Button/Button.tsx'
import { PageHeader } from '../../components/PageHeader/PageHeader.tsx'
import { TextField } from '../../components/TextField/TextField.tsx'
import { useRegister, useSession, useSignIn } from '../../hooks/useSession.ts'
import { ApiError } from '../../lib/http/ApiError.ts'
import { AuthPaths } from '../../lib/routing/AuthPaths.ts'
import type { Credentials } from '../../lib/vitrine/AuthApi.ts'
import { CredentialRules, type AuthMode, type CredentialErrors } from './CredentialRules.ts'
import styles from './AuthForm.module.css'

type AuthCopy = {
  readonly title: string
  readonly submit: string
  readonly pending: string
  readonly passwordAutoComplete: 'current-password' | 'new-password'
  readonly passwordHint: string | null
  readonly switchPrompt: string
  readonly switchLabel: string
}

class AuthFeedback {
  static readonly #copy: Readonly<Record<AuthMode, AuthCopy>> = {
    'sign-in': {
      title: 'Sign in',
      submit: 'Sign in',
      pending: 'Signing in…',
      passwordAutoComplete: 'current-password',
      passwordHint: null,
      switchPrompt: 'New to Vitrine?',
      switchLabel: 'Create an account',
    },
    register: {
      title: 'Create an account',
      submit: 'Create account',
      pending: 'Creating account…',
      passwordAutoComplete: 'new-password',
      passwordHint: '8 or more characters.',
      switchPrompt: 'Already have an account?',
      switchLabel: 'Sign in',
    },
  }

  static copy(mode: AuthMode): AuthCopy {
    return AuthFeedback.#copy[mode]
  }

  static formError(error: Error | null): string | null {
    if (error === null) return null
    if (!(error instanceof ApiError)) return 'Something went wrong. Try again.'
    if (error.fieldError('username') !== null || error.fieldError('password') !== null) return null
    return error.message
  }

  static fieldError(checks: CredentialErrors, error: Error | null, field: keyof Credentials): string | null {
    const serverError = error instanceof ApiError ? error.fieldError(field) : null
    return checks[field] ?? serverError
  }
}

type AuthFormProps = {
  readonly mode: AuthMode
}

export function AuthForm({ mode }: AuthFormProps) {
  const copy = AuthFeedback.copy(mode)
  const [searchParams] = useSearchParams()
  const next = AuthPaths.nextFrom(searchParams)
  const { user } = useSession()
  const signIn = useSignIn()
  const register = useRegister()
  const mutation = mode === 'register' ? register : signIn
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [checks, setChecks] = useState<CredentialErrors>({})

  if (user !== null) return <Navigate to={next} replace />

  const forget = (field: keyof Credentials) => {
    setChecks(({ [field]: _removed, ...rest }) => rest)
    if (mutation.isError) mutation.reset()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const credentials = { username: username.trim(), password }
    const found = CredentialRules.check(mode, credentials)
    setChecks(found)
    if (!CredentialRules.hasProblems(found)) mutation.mutate(credentials)
  }

  const formError = AuthFeedback.formError(mutation.error)

  return (
    <div className={styles.panel}>
      <PageHeader size="heading" title={copy.title} lead="Save works and keep private notes as you explore." />
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          error={AuthFeedback.fieldError(checks, mutation.error, 'username')}
          onChange={(event) => {
            setUsername(event.target.value)
            forget('username')
          }}
        />
        <TextField
          label="Password"
          name="password"
          type={isPasswordShown ? 'text' : 'password'}
          autoComplete={copy.passwordAutoComplete}
          value={password}
          hint={copy.passwordHint}
          error={AuthFeedback.fieldError(checks, mutation.error, 'password')}
          onChange={(event) => {
            setPassword(event.target.value)
            forget('password')
          }}
          action={
            <Button variant="quiet" size="small" onClick={() => setIsPasswordShown(!isPasswordShown)}>
              {isPasswordShown ? 'Hide' : 'Show'}
              <span className="visually-hidden"> password</span>
            </Button>
          }
        />
        {formError !== null && (
          <p role="alert" className={styles.formError}>
            {formError}
          </p>
        )}
        <Button type="submit" variant="primary" block pending={mutation.isPending}>
          {mutation.isPending ? copy.pending : copy.submit}
        </Button>
      </form>
      <p className={styles.switch}>
        {copy.switchPrompt}{' '}
        <Link to={mode === 'register' ? AuthPaths.signIn(next) : AuthPaths.register(next)}>{copy.switchLabel}</Link>
      </p>
    </div>
  )
}
