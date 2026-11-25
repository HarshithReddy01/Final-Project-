import type { UseQueryResult } from '@tanstack/react-query'
import { Navigate } from 'react-router'
import { ArtworkCard } from '../../components/ArtworkCard/ArtworkCard.tsx'
import { ArtworkGrid, ArtworkGridSkeleton } from '../../components/ArtworkGrid/ArtworkGrid.tsx'
import { Button } from '../../components/Button/Button.tsx'
import { Pagination } from '../../components/Pagination/Pagination.tsx'
import { Section } from '../../components/Section/Section.tsx'
import { StatusMessage } from '../../components/StatusMessage/StatusMessage.tsx'
import { cx } from '../../lib/cx.ts'
import { Pagination as PageModel } from '../../lib/met/Pagination.ts'
import { SearchQuery } from '../../lib/met/SearchQuery.ts'
import type { SearchPage } from '../../lib/met/SearchPage.ts'
import { ResultsHeading } from './ResultsHeading.ts'
import styles from './SearchResults.module.css'

type SearchResultsProps = {
  readonly query: SearchQuery
  readonly requestedPage: number
  readonly search: UseQueryResult<SearchPage>
  readonly onClear: () => void
}

export function SearchResults({ query, requestedPage, search, onClear }: SearchResultsProps) {
  const title = ResultsHeading.title(query)

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

  if (results.total === 0) {
    return (
      <StatusMessage
        announce="status"
        title="No works match"
        action={query.equals(SearchQuery.empty) ? undefined : <Button onClick={onClear}>Clear filters</Button>}
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
      <ArtworkGrid
        aria-label={title}
        aria-busy={search.isPlaceholderData}
        className={cx(search.isPlaceholderData && styles.refreshing)}
      >
        {results.objectIds.map((objectId) => (
          <ArtworkCard key={objectId} objectId={objectId} backLabel={ResultsHeading.backLabel(query)} />
        ))}
      </ArtworkGrid>
      <Pagination pagination={pagination} />
    </Section>
  )
}
