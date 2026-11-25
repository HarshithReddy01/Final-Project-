import { Link, useLocation } from 'react-router'
import { useFavorites, useRemoveFavorite, useSaveFavorite } from '../../hooks/useFavorites.ts'
import { useSession } from '../../hooks/useSession.ts'
import { cx } from '../../lib/cx.ts'
import type { Artwork } from '../../lib/met/Artwork.ts'
import { AuthPaths } from '../../lib/routing/AuthPaths.ts'
import { Button, ButtonLink } from '../Button/Button.tsx'
import { Icon } from '../Icon/Icon.tsx'
import styles from './SaveButton.module.css'

type SaveButtonProps = {
  readonly artwork: Artwork
  readonly variant: 'icon' | 'full'
  readonly className?: string
}

export function SaveButton({ artwork, variant, className }: SaveButtonProps) {
  const { user } = useSession()
  const { collection } = useFavorites()
  const save = useSaveFavorite()
  const remove = useRemoveFavorite()
  const location = useLocation()
  const saved = collection.has(artwork.id)
  const busy = save.isPending || remove.isPending
  const saveLabel = `Save ${artwork.title}`
  const removeLabel = `Remove ${artwork.title} from your collection`

  if (user === null) {
    const signIn = AuthPaths.signIn(AuthPaths.returnTo(location))
    if (variant === 'icon') {
      return (
        <Link to={signIn} className={cx(styles.icon, className)} aria-label={saveLabel}>
          <Icon name="bookmark" />
        </Link>
      )
    }
    return (
      <ButtonLink to={signIn} variant="secondary" className={className}>
        <Icon name="bookmark" />
        Sign in to save
      </ButtonLink>
    )
  }

  const toggle = () => {
    if (saved) {
      remove.mutate(artwork.id)
      return
    }
    save.mutate({ objectId: artwork.id, snapshot: artwork.toSnapshot() })
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        className={cx(styles.icon, saved && styles.saved, className)}
        aria-pressed={saved}
        aria-label={saved ? removeLabel : saveLabel}
        aria-disabled={busy || undefined}
        onClick={busy ? undefined : toggle}
      >
        <Icon name={saved ? 'bookmark-filled' : 'bookmark'} />
      </button>
    )
  }

  return (
    <Button
      variant="secondary"
      pending={busy}
      className={cx(saved && styles.saved, className)}
      aria-pressed={saved}
      onClick={toggle}
    >
      <Icon name={saved ? 'bookmark-filled' : 'bookmark'} className={styles.mark} />
      {saved ? (
        <span>
          Remove <span className="visually-hidden">{artwork.title} </span>from your collection
        </span>
      ) : (
        <span>
          Save<span className="visually-hidden"> {artwork.title}</span>
        </span>
      )}
    </Button>
  )
}
