import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import type { NavLinkRenderProps } from 'react-router'
import { Button, ButtonLink } from '../components/Button/Button.tsx'
import { useFavorites } from '../hooks/useFavorites.ts'
import { useSession, useSignOut } from '../hooks/useSession.ts'
import { cx } from '../lib/cx.ts'
import { TextFormat } from '../lib/format/TextFormat.ts'
import { AuthPaths } from '../lib/routing/AuthPaths.ts'
import styles from './SiteHeader.module.css'

function navLinkClassName({ isActive }: NavLinkRenderProps): string {
  return cx(styles.navLink, isActive && styles.active)
}

function CollectionCount() {
  const { user } = useSession()
  const { collection, isPending } = useFavorites()
  if (user === null || isPending) return null
  return (
    <>
      <span className={styles.count} aria-hidden="true">
        {TextFormat.number(collection.size)}
      </span>
      <span className="visually-hidden">, {TextFormat.count(collection.size, 'work', 'works')}</span>
    </>
  )
}

function AccountActions() {
  const { user, isPending } = useSession()
  const signOut = useSignOut()
  const location = useLocation()
  const navigate = useNavigate()

  if (isPending) return null

  if (user === null) {
    const returnTo = AuthPaths.returnTo(location)
    return (
      <>
        <ButtonLink to={AuthPaths.signIn(returnTo)} variant="quiet" size="small">
          Sign in
        </ButtonLink>
        <ButtonLink to={AuthPaths.register(returnTo)} variant="secondary" size="small">
          Create account
        </ButtonLink>
      </>
    )
  }

  const handleSignOut = () => {
    void navigate('/')
    signOut.mutate()
  }

  return (
    <>
      <span className={styles.username} title={user.username}>
        {user.username}
      </span>
      <Button variant="quiet" size="small" pending={signOut.isPending} onClick={handleSignOut}>
        Sign out
      </Button>
    </>
  )
}

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link to="/" className={styles.wordmark}>
          Vitrine
        </Link>
        <nav aria-label="Main" className={styles.nav}>
          <NavLink to="/" end className={navLinkClassName}>
            <span className={styles.navLabel}>Explore</span>
          </NavLink>
          <NavLink to="/collection" className={navLinkClassName}>
            <span className={styles.navLabel}>Your collection</span>
            <CollectionCount />
          </NavLink>
        </nav>
        <div className={styles.account}>
          <AccountActions />
        </div>
      </div>
    </header>
  )
}
