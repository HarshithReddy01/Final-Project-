import { useId } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../components/Button/Button.tsx'
import { Icon } from '../../components/Icon/Icon.tsx'
import type { SearchQuery } from '../../lib/met/SearchQuery.ts'
import styles from './SearchForm.module.css'

type SearchFormProps = {
  readonly query: SearchQuery
  readonly onSearch: (query: SearchQuery) => void
}

export function SearchForm({ query, onSearch }: SearchFormProps) {
  const inputId = useId()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = new FormData(event.currentTarget).get('q')
    onSearch(query.with({ text: typeof text === 'string' ? text : '' }))
  }

  return (
    <search className={styles.search}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label htmlFor={inputId} className="visually-hidden">
          Search the collection
        </label>
        <div className={styles.row}>
          <Icon name="search" className={styles.icon} />
          <input
            key={query.text}
            id={inputId}
            name="q"
            type="search"
            defaultValue={query.text}
            placeholder="Artist, title, material, place"
            autoComplete="off"
            enterKeyHint="search"
            spellCheck={false}
            maxLength={200}
            className={styles.input}
          />
          <Button type="submit" variant="primary">
            Search
          </Button>
        </div>
      </form>
    </search>
  )
}
