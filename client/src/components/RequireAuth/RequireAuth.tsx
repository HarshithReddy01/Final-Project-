import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useSession } from '../../hooks/useSession.ts'
import { AuthPaths } from '../../lib/routing/AuthPaths.ts'

type RequireAuthProps = {
  readonly children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, isPending } = useSession()
  const location = useLocation()
  if (isPending) return null
  if (user === null) return <Navigate to={AuthPaths.signIn(AuthPaths.returnTo(location))} replace />
  return children
}
