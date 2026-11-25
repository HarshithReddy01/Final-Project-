import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '../lib/services.ts'
import type { Credentials } from '../lib/vitrine/AuthApi.ts'
import type { User } from '../lib/vitrine/User.ts'
import { QueryKeys } from './QueryKeys.ts'
import { SessionCache } from './SessionCache.ts'

export type SessionState = {
  readonly user: User | null
  readonly isPending: boolean
}

export function useSession(): SessionState {
  const query = useQuery({
    queryKey: QueryKeys.session,
    queryFn: ({ signal }) => services.auth.getSession(signal),
    staleTime: Infinity,
  })
  return { user: query.data ?? null, isPending: query.isPending }
}

export function useSignIn() {
  const session = new SessionCache(useQueryClient())
  return useMutation({
    mutationFn: (credentials: Credentials) => services.auth.signIn(credentials),
    onSuccess: (user) => session.signedIn(user),
  })
}

export function useRegister() {
  const session = new SessionCache(useQueryClient())
  return useMutation({
    mutationFn: (credentials: Credentials) => services.auth.register(credentials),
    onSuccess: (user) => session.signedIn(user),
  })
}

export function useSignOut() {
  const session = new SessionCache(useQueryClient())
  return useMutation({
    mutationFn: () => services.auth.signOut(),
    onSuccess: () => session.signedOut(),
  })
}
