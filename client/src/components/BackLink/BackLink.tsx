import { Link, useLocation, useNavigate } from 'react-router'
import { cx } from '../../lib/cx.ts'
import { ReturnLocation } from '../../lib/routing/ReturnLocation.ts'
import { Icon } from '../Icon/Icon.tsx'
import styles from './BackLink.module.css'

type BackLinkProps = {
  readonly className?: string
}

export function BackLink({ className }: BackLinkProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const origin = ReturnLocation.fromState(location.state)

  if (origin === null) {
    return (
      <Link to="/" className={cx(styles.back, className)}>
        <Icon name="arrow-left" />
        <span className={styles.label}>Explore the collection</span>
      </Link>
    )
  }

  return (
    <button type="button" className={cx(styles.back, className)} onClick={() => void navigate(-1)}>
      <Icon name="arrow-left" />
      <span className={styles.label}>{origin.label}</span>
    </button>
  )
}
