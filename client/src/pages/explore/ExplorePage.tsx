import { useSearchParams } from 'react-router'
import { Page } from '../../components/Page/Page.tsx'
import { PageHeader } from '../../components/PageHeader/PageHeader.tsx'
import { useSearch } from '../../hooks/useCollection.ts'
import { Pagination } from '../../lib/met/Pagination.ts'
import { SearchQuery } from '../../lib/met/SearchQuery.ts'
import { FilterBar } from './FilterBar.tsx'
import { ResultsHeading } from './ResultsHeading.ts'
import { SearchForm } from './SearchForm.tsx'
import { SearchResults } from './SearchResults.tsx'
import styles from './ExplorePage.module.css'

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = SearchQuery.fromSearchParams(searchParams)
  const requestedPage = Pagination.parsePage(searchParams.get(Pagination.pageParam))
  const search = useSearch(query, requestedPage)

  const apply = (next: SearchQuery) => {
    const page = next.cacheKey === query.cacheKey ? requestedPage : 1
    setSearchParams(next.toSearchParams(page), { preventScrollReset: true })
  }

  return (
    <Page title={query.isBlank ? null : ResultsHeading.title(query)}>
      <PageHeader
        title="Search the collection"
        lead="More than 470,000 works from The Met’s Open Access program. Save the ones that stay with you."
      />
      <div className={styles.controls}>
        <SearchForm query={query} onSearch={apply} />
        <FilterBar query={query} onChange={apply} />
      </div>
      <SearchResults query={query} requestedPage={requestedPage} search={search} onChange={apply} />
    </Page>
  )
}
