import type { ReactNode } from 'react'
import { cx } from '../../lib/cx.ts'
import typography from '../../styles/typography.module.css'
import styles from './PageHeader.module.css'

type PageHeaderProps = {
  readonly title: string
  readonly lead?: ReactNode
  readonly meta?: ReactNode
  readonly actions?: ReactNode
  readonly size?: 'display' | 'heading'
  readonly className?: string
}

export function PageHeader({ title, lead, meta, actions, size = 'display', className }: PageHeaderProps) {
  return (
    <header className={cx(styles.header, className)}>
      <h1 className={size === 'display' ? cx(typography.display, styles.display) : typography.heading}>{title}</h1>
      {lead !== undefined && <p className={typography.lead}>{lead}</p>}
      {meta !== undefined && <p className={typography.label}>{meta}</p>}
      {actions !== undefined && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
