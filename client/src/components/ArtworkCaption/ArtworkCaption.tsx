import { cx } from '../../lib/cx.ts'
import typography from '../../styles/typography.module.css'
import styles from './ArtworkCaption.module.css'

type ArtworkCaptionProps = {
  readonly title: string
  readonly maker: string
  readonly date: string
  readonly size?: 'regular' | 'large'
  readonly className?: string
}

export function ArtworkCaption({ title, maker, date, size = 'regular', className }: ArtworkCaptionProps) {
  return (
    <span className={cx(styles.caption, size === 'large' && styles.large, className)}>
      <span className={cx(typography.artworkTitle, styles.title)}>{title}</span>
      {maker !== '' && <span className={styles.maker}>{maker}</span>}
      {date !== '' && <span className={cx(typography.label, styles.date)}>{date}</span>}
    </span>
  )
}
