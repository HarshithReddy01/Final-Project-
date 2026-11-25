import { Button } from '../components/Button/Button.tsx'
import { Page } from '../components/Page/Page.tsx'
import { PageHeader } from '../components/PageHeader/PageHeader.tsx'
import styles from './RouteErrorBoundary.module.css'

export function RouteErrorBoundary() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.bar}>
          <a href="/" className={styles.wordmark}>
            Vitrine
          </a>
        </div>
      </header>
      <main className={styles.main}>
        <Page title="Something went wrong">
          <PageHeader
            title="Something went wrong"
            lead="Reload the page to try again."
            actions={
              <Button variant="primary" onClick={() => window.location.reload()}>
                Reload
              </Button>
            }
          />
        </Page>
      </main>
    </div>
  )
}
