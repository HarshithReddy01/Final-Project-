import type { ReactNode } from 'react'
import { cx } from '../../lib/cx.ts'
import typography from '../../styles/typography.module.css'
import styles from './StatusMessage.module.css'

type StatusMessageProps = {
  readonly title: string
  readonly children?: ReactNode
  readonly action?: ReactNode
  readonly headingLevel?: 'h1' | 'h2' | 'h3'
  readonly announce?: 'status' | 'alert'
  readonly className?: string
}

export function StatusMessage({
  title,
  children,
  action,
  headingLevel: Heading = 'h2',
  announce,
  className,
}: StatusMessageProps) {
  return (
    <div role={announce} className={cx(styles.message, className)}>
      <Heading className={typography.heading}>{title}</Heading>
      {children !== undefined && <div className={styles.body}>{children}</div>}
      {action !== undefined && <div className={styles.action}>{action}</div>}
    </div>
  )
}
