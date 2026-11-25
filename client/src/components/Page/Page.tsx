import type { ReactNode } from 'react'
import { cx } from '../../lib/cx.ts'
import styles from './Page.module.css'

type PageProps = {
  readonly title: string | null
  readonly children: ReactNode
  readonly className?: string
}

export function Page({ title, children, className }: PageProps) {
  return (
    <div className={cx(styles.page, className)}>
      <title>{title === null ? 'Vitrine' : `${title} · Vitrine`}</title>
      {children}
    </div>
  )
}
