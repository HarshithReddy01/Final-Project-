import { useParams } from 'react-router'
import { BackLink } from '../../components/BackLink/BackLink.tsx'
import { Button, ButtonLink } from '../../components/Button/Button.tsx'
import { Page } from '../../components/Page/Page.tsx'
import { StatusMessage } from '../../components/StatusMessage/StatusMessage.tsx'
import { useArtwork } from '../../hooks/useCollection.ts'
import { ApiError } from '../../lib/http/ApiError.ts'
import { Artwork } from '../../lib/met/Artwork.ts'
import { ArtworkViewer } from './ArtworkViewer.tsx'
import { WallLabel } from './WallLabel.tsx'
import styles from './ArtworkPage.module.css'

export function ArtworkPage() {
  const { objectId } = useParams()
  const id = Artwork.parseId(objectId)
  const artwork = useArtwork(id)

  if (id === null) return <MissingRecord />
  if (artwork.isPending) return <LoadingRecord />
  if (artwork.isError) {
    if (artwork.error instanceof ApiError && artwork.error.isNotFound) return <MissingRecord />
    return <UnavailableRecord onRetry={() => void artwork.refetch()} />
  }

  return (
    <Page title={artwork.data.title}>
      <div className={styles.stack}>
        <BackLink />
        <article className={styles.article}>
          <ArtworkViewer artwork={artwork.data} />
          <WallLabel artwork={artwork.data} />
        </article>
      </div>
    </Page>
  )
}

function LoadingRecord() {
  return (
    <Page title={null}>
      <div className={styles.stack}>
        <BackLink />
        <div className={styles.article} aria-hidden="true">
          <div className={styles.placeholderFrame} />
          <div className={styles.placeholderLabel}>
            <span className={styles.placeholderLine} />
            <span className={styles.placeholderLine} />
            <span className={styles.placeholderLine} />
            <span className={styles.placeholderLine} />
          </div>
        </div>
        <output className="visually-hidden">Loading the record</output>
      </div>
    </Page>
  )
}

function MissingRecord() {
  return (
    <Page title="Not available">
      <div className={styles.stack}>
        <BackLink />
        <StatusMessage
          headingLevel="h1"
          title="This record isn’t available"
          action={
            <ButtonLink to="/" variant="secondary">
              Back to explore
            </ButtonLink>
          }
        >
          The Met’s collection has no public record at this address.
        </StatusMessage>
      </div>
    </Page>
  )
}

type UnavailableRecordProps = {
  readonly onRetry: () => void
}

function UnavailableRecord({ onRetry }: UnavailableRecordProps) {
  return (
    <Page title="Not loaded">
      <div className={styles.stack}>
        <BackLink />
        <StatusMessage
          headingLevel="h1"
          announce="alert"
          title="This work didn’t load"
          action={<Button onClick={onRetry}>Try again</Button>}
        >
          The Met’s API may be busy. Try again in a moment.
        </StatusMessage>
      </div>
    </Page>
  )
}
