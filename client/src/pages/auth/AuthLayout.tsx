import type { ReactNode } from 'react'
import { Page } from '../../components/Page/Page.tsx'
import { FeaturedWork } from './FeaturedWork.tsx'
import styles from './AuthLayout.module.css'

type AuthLayoutProps = {
  readonly title: string
  readonly children: ReactNode
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <Page title={title}>
      <div className={styles.layout}>
        <div className={styles.form}>{children}</div>
        <FeaturedWork />
      </div>
    </Page>
  )
}
