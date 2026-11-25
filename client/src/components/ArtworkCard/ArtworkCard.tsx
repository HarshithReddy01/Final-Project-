import { Link, useLocation } from 'react-router'
import { useArtwork } from '../../hooks/useCollection.ts'
import { cx } from '../../lib/cx.ts'
import { ApiError } from '../../lib/http/ApiError.ts'
import { ReturnLocation } from '../../lib/routing/ReturnLocation.ts'
import typography from '../../styles/typography.module.css'
import { ArtworkCaption } from '../ArtworkCaption/ArtworkCaption.tsx'
import { ArtworkFrame } from '../ArtworkFrame/ArtworkFrame.tsx'
import { Button } from '../Button/Button.tsx'
import { SaveButton } from '../SaveButton/SaveButton.tsx'
import { ArtworkCardSkeleton } from './ArtworkCardSkeleton.tsx'
import styles from './ArtworkCard.module.css'

type ArtworkCardProps = {
  readonly objectId: number
  readonly backLabel?: string
}

export function ArtworkCard({ objectId, backLabel = 'Back to results' }: ArtworkCardProps) {
  const query = useArtwork(objectId)
  const location = useLocation()

  if (query.isPending) return <ArtworkCardSkeleton />

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.isNotFound) return null
    return (
      <li className={styles.card}>
        <div className={styles.failed}>
          <p className={cx(typography.label, styles.failedText)}>This work didn’t load</p>
          <Button variant="quiet" size="small" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      </li>
    )
  }

  const artwork = query.data
  const origin = new ReturnLocation(`${location.pathname}${location.search}`, backLabel)
  return (
    <li className={styles.card}>
      <Link to={`/artworks/${artwork.id}`} state={origin.toState()} className={styles.link}>
        <ArtworkFrame src={artwork.primaryImage?.displayUrl ?? null} alt="" title={artwork.title} />
        <ArtworkCaption title={artwork.title} maker={artwork.maker} date={artwork.date} />
      </Link>
      <div className={styles.save}>
        <SaveButton artwork={artwork} variant="icon" />
      </div>
    </li>
  )
}
