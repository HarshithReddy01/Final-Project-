import { useId } from 'react'
import type { ReactNode } from 'react'
import { cx } from '../../lib/cx.ts'
import typography from '../../styles/typography.module.css'
import styles from './Section.module.css'

type SectionProps = {
  readonly title?: string
  readonly meta?: ReactNode
  readonly label?: string
  readonly children: ReactNode
  readonly className?: string
}

export function Section({ title, meta, label, children, className }: SectionProps) {
  const titleId = useId()
  const hasHeader = title !== undefined || meta !== undefined
  return (
    <section
      className={cx(styles.section, className)}
      aria-labelledby={title === undefined ? undefined : titleId}
      aria-label={title === undefined ? label : undefined}
    >
      {hasHeader && (
        <div className={styles.header}>
          {title !== undefined && (
            <h2 id={titleId} className={typography.heading}>
              {title}
            </h2>
          )}
          {meta !== undefined && <p className={cx(typography.label, styles.meta)}>{meta}</p>}
        </div>
      )}
      {children}
    </section>
  )
}
