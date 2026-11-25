import { cx } from '../../lib/cx.ts'
import styles from './ArtworkCardSkeleton.module.css'

export function ArtworkCardSkeleton() {
  return (
    <li className={styles.skeleton} aria-hidden="true">
      <span className={styles.mat} />
      <span className={styles.line} />
      <span className={cx(styles.line, styles.short)} />
    </li>
  )
}
