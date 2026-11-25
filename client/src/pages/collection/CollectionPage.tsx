import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { ArtworkGrid, ArtworkGridSkeleton } from '../../components/ArtworkGrid/ArtworkGrid.tsx'
import { Button, ButtonLink } from '../../components/Button/Button.tsx'
import { CollectionCard } from '../../components/CollectionCard/CollectionCard.tsx'
import { Page } from '../../components/Page/Page.tsx'
import { PageHeader } from '../../components/PageHeader/PageHeader.tsx'
import { Select } from '../../components/Select/Select.tsx'
import { StatusMessage } from '../../components/StatusMessage/StatusMessage.tsx'
import { TextField } from '../../components/TextField/TextField.tsx'
import { QueryKeys } from '../../hooks/QueryKeys.ts'
import { useFavorites } from '../../hooks/useFavorites.ts'
import { TextFormat } from '../../lib/format/TextFormat.ts'
import { FavoriteCollection } from '../../lib/vitrine/FavoriteCollection.ts'
import { CollectionView, type CollectionViewChanges } from './CollectionView.ts'
import styles from './CollectionPage.module.css'

export function CollectionPage() {
  const { collection, isPending, error } = useFavorites()
  const isReady = !isPending && error === null

  return (
    <Page title="Your collection">
      <PageHeader
        title="Your collection"
        meta={isReady ? TextFormat.count(collection.size, 'work', 'works') : undefined}
      />
      <CollectionContents collection={collection} isPending={isPending} error={error} />
    </Page>
  )
}

type CollectionContentsProps = {
  readonly collection: FavoriteCollection
  readonly isPending: boolean
  readonly error: Error | null
}

function CollectionContents({ collection, isPending, error }: CollectionContentsProps) {
  const queryClient = useQueryClient()

  if (isPending) return <ArtworkGridSkeleton count={8} label="Loading your collection" />

  if (error !== null) {
    return (
      <StatusMessage
        announce="alert"
        title="Your collection didn’t load"
        action={
          <Button onClick={() => void queryClient.refetchQueries({ queryKey: QueryKeys.favorites })}>Try again</Button>
        }
      >
        Check your connection and try again.
      </StatusMessage>
    )
  }

  if (collection.isEmpty) {
    return (
      <StatusMessage
        announce="status"
        title="Nothing saved yet"
        action={
          <ButtonLink to="/" variant="primary">
            Explore the collection
          </ButtonLink>
        }
      >
        Works you save while exploring will appear here, with room for your own notes.
      </StatusMessage>
    )
  }

  return <SavedWorks collection={collection} />
}

type SavedWorksProps = {
  readonly collection: FavoriteCollection
}

function SavedWorks({ collection }: SavedWorksProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const view = new CollectionView(searchParams)
  const visible = view.apply(collection).toArray()

  const change = (changes: CollectionViewChanges) => {
    setSearchParams(view.toSearchParams(changes), { replace: true, preventScrollReset: true })
  }

  return (
    <div className={styles.body}>
      <div className={styles.toolbar}>
        <TextField
          label="Filter"
          type="search"
          placeholder="Filter by title, artist or note"
          autoComplete="off"
          value={view.filter}
          onChange={(event) => change({ filter: event.target.value })}
          className={styles.filter}
        />
        <Select
          label="Sort"
          value={view.order}
          onChange={(event) => change({ order: FavoriteCollection.parseSortOrder(event.target.value) })}
          className={styles.sort}
        >
          {FavoriteCollection.sortOrders.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      {visible.length === 0 ? (
        <StatusMessage
          announce="status"
          title={`No saved works match “${view.filter.trim()}”`}
          action={<Button onClick={() => change({ filter: '' })}>Clear filter</Button>}
        >
          The filter looks at titles, artists and your notes.
        </StatusMessage>
      ) : (
        <ArtworkGrid aria-label="Saved works">
          {visible.map((favorite) => (
            <CollectionCard key={favorite.objectId} favorite={favorite} />
          ))}
        </ArtworkGrid>
      )}
    </div>
  )
}
