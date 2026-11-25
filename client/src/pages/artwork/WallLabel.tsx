import { Link } from 'react-router'
import { Icon } from '../../components/Icon/Icon.tsx'
import { SaveButton } from '../../components/SaveButton/SaveButton.tsx'
import { cx } from '../../lib/cx.ts'
import type { Artwork } from '../../lib/met/Artwork.ts'
import { SearchQuery } from '../../lib/met/SearchQuery.ts'
import typography from '../../styles/typography.module.css'
import { NoteEditor } from './NoteEditor.tsx'
import styles from './WallLabel.module.css'

type WallLabelProps = {
  readonly artwork: Artwork
}

export function WallLabel({ artwork }: WallLabelProps) {
  const context = [artwork.department, artwork.isHighlight ? 'Highlight' : ''].filter((part) => part !== '')

  return (
    <div className={styles.label}>
      <header className={styles.header}>
        {context.length > 0 && <p className={typography.label}>{context.join(' · ')}</p>}
        <h1 className={styles.title}>{artwork.title}</h1>
        <div className={styles.maker}>
          <p className={styles.makerName}>{artwork.maker}</p>
          {artwork.makerBio !== '' && <p className={styles.makerBio}>{artwork.makerBio}</p>}
        </div>
      </header>

      <div className={styles.actions}>
        <SaveButton artwork={artwork} variant="full" />
        <NoteEditor objectId={artwork.id} />
      </div>

      {artwork.facts.length > 0 && (
        <dl className={styles.facts}>
          {artwork.facts.map((fact) => (
            <div key={fact.label} className={styles.fact}>
              <dt className={cx(typography.label, styles.term)}>{fact.label}</dt>
              <dd className={cx(styles.value, fact.tone === 'mono' && styles.mono)}>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {artwork.subjects.length > 0 && (
        <section className={styles.subjects} aria-labelledby={`subjects-${artwork.id}`}>
          <h2 id={`subjects-${artwork.id}`} className={typography.label}>
            Subjects
          </h2>
          <ul className={styles.subjectList}>
            {artwork.subjects.map((subject) => (
              <li key={subject}>
                <Link to={`/?${SearchQuery.empty.with({ text: subject, field: 'tags' }).toSearchParams()}`}>
                  {subject}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className={styles.footer}>
        <p className={typography.label}>{artwork.isPublicDomain ? 'Public domain' : 'Image rights restricted'}</p>
        <a className={styles.external} href={artwork.sourceUrl} target="_blank" rel="noreferrer">
          View on metmuseum.org
          <Icon name="arrow-up-right" />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </footer>
    </div>
  )
}
