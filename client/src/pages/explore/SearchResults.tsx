import type { UseQueryResult } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router'
import { ArtworkCard } from '../../components/ArtworkCard/ArtworkCard.tsx'
import { ArtworkCardSkeleton } from '../../components/ArtworkCard/ArtworkCardSkeleton.tsx'
import { ArtworkGrid, ArtworkGridSkeleton } from '../../components/ArtworkGrid/ArtworkGrid.tsx'
import { Button } from '../../components/Button/Button.tsx'
import { Pagination } from '../../components/Pagination/Pagination.tsx'
import { Section } from '../../components/Section/Section.tsx'
import { StatusMessage } from '../../components/StatusMessage/StatusMessage.tsx'
import { useArtworkLoads } from '../../hooks/useCollection.ts'
import { cx } from '../../lib/cx.ts'
import { Pagination as PageModel } from '../../lib/met/Pagination.ts'
import { SearchQuery } from '../../lib/met/SearchQuery.ts'
import type { SearchPage } from '../../lib/met/SearchPage.ts'
import { VisibleResults } from '../../lib/met/VisibleResults.ts'
import { HiddenWorksNote } from './HiddenWorksNote.tsx'
import { ResultsHeading } from './ResultsHeading.ts'
import styles from './SearchResults.module.css'

type SearchResultsProps = {
  readonly query: SearchQuery
  readonly requestedPage: number
  readonly search: UseQueryResult<SearchPage>
  readonly onChange: (query: SearchQuery) => void
}

export function SearchResults({ query, requestedPage, search, onChange }: SearchResultsProps) {
  const loads = useArtworkLoads(search.data?.objectIds ?? [])
  const gridRef = useRef<HTMLUListElement>(null)
  const focusGridOnReveal = useRef(false)
  const title = ResultsHeading.title(query)

  useEffect(() => {
    if (!focusGridOnReveal.current || !query.includeImageless) return
    focusGridOnReveal.current = false
    gridRef.current?.focus({ preventScroll: true })
  }, [query.includeImageless])

  if (search.isPending) {
    return (
      <Section title={title} meta="Searching…">
        <ArtworkGridSkeleton label="Searching the collection" />
      </Section>
    )
  }

  if (search.isError) {
    return (
      <StatusMessage
        announce="alert"
        title="The collection didn’t respond"
        action={<Button onClick={() => void search.refetch()}>Try again</Button>}
      >
        The Met’s API may be busy. Try again in a moment.
      </StatusMessage>
    )
  }

  const results = search.data
  const pagination = new PageModel(results.total, requestedPage)
  const visible = VisibleResults.from(loads, query.includeImageless)
  const toggleImageless = () => onChange(query.with({ includeImageless: !query.includeImageless }))
  const revealAll = () => {
    focusGridOnReveal.current = true
    onChange(query.with({ includeImageless: true }))
  }

  if (results.total === 0) {
    return (
      <StatusMessage
        announce="status"
        title="No works match"
        action={
          query.equals(SearchQuery.empty) ? undefined : (
            <Button onClick={() => onChange(SearchQuery.empty)}>Clear filters</Button>
          )
        }
      >
        Try a broader term or remove a filter.
      </StatusMessage>
    )
  }

  if (!search.isPlaceholderData && pagination.page !== requestedPage) {
    return <Navigate to={{ search: query.toSearchParams(pagination.page).toString() }} replace />
  }

  return (
    <Section title={title} meta={ResultsHeading.meta(pagination)}>
      {visible.isEmpty ? (
        <StatusMessage
          announce="status"
          headingLevel="h3"
          title="No open-access images on this page"
          action={<Button onClick={revealAll}>Show these works anyway</Button>}
        >
          These works are in The Met’s collection, but their images aren’t part of the Open Access program.
        </StatusMessage>
      ) : (
        <ArtworkGrid
          ref={gridRef}
          tabIndex={-1}
          aria-label={title}
          aria-busy={search.isPlaceholderData || !visible.isSettled}
          className={cx(styles.grid, search.isPlaceholderData && styles.refreshing)}
        >
          {visible.ids.map((objectId) => (
            <ArtworkCard key={objectId} objectId={objectId} backLabel={ResultsHeading.backLabel(query)} />
          ))}
          {Array.from({ length: visible.pendingCount }, (_, index) => (
            <ArtworkCardSkeleton key={`pending-${index}`} />
          ))}
        </ArtworkGrid>
      )}
      {visible.isSettled && visible.imagelessCount > 0 && !visible.isEmpty && (
        <HiddenWorksNote
          count={visible.imagelessCount}
          isShowing={query.includeImageless}
          onToggle={toggleImageless}
        />
      )}
      <Pagination pagination={pagination} />
    </Section>
  )
}
