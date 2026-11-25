import { Link } from 'react-router'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Link to="/" className={styles.wordmark}>
          Vitrine
        </Link>
        <div className={styles.notes}>
          <p>A reading room for The Met’s Open Access collection.</p>
          <p>
            Collection data and images:{' '}
            <a
              href="https://www.metmuseum.org/about-the-met/policies-and-documents/open-access"
              target="_blank"
              rel="noreferrer"
            >
              The Metropolitan Museum of Art, Open Access (CC0)
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  )
}
