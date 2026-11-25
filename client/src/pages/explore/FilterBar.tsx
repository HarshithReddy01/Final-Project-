import { useId } from 'react'
import { Button } from '../../components/Button/Button.tsx'
import { Checkbox } from '../../components/Checkbox/Checkbox.tsx'
import { Select } from '../../components/Select/Select.tsx'
import { useDepartments } from '../../hooks/useCollection.ts'
import { Period } from '../../lib/met/Period.ts'
import { SearchField } from '../../lib/met/SearchField.ts'
import { SearchQuery } from '../../lib/met/SearchQuery.ts'
import styles from './FilterBar.module.css'

type FilterBarProps = {
  readonly query: SearchQuery
  readonly onChange: (query: SearchQuery) => void
}

export function FilterBar({ query, onChange }: FilterBarProps) {
  const departments = useDepartments()
  const fieldGroup = useId()

  return (
    <div className={styles.bar}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Search in</legend>
        <div className={styles.tabs}>
          {SearchField.all.map((field) => (
            <label key={field.key} className={styles.tab}>
              <input
                type="radio"
                name={fieldGroup}
                value={field.key}
                checked={query.field === field.key}
                onChange={() => onChange(query.with({ field: field.key }))}
                className={styles.radio}
              />
              <span>{field.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Select
        label="Department"
        value={query.departmentId === null ? '' : String(query.departmentId)}
        onChange={(event) =>
          onChange(query.with({ departmentId: event.target.value === '' ? null : Number(event.target.value) }))
        }
        className={styles.select}
      >
        <option value="">All departments</option>
        {departments.data?.map((department) => (
          <option key={department.id} value={String(department.id)}>
            {department.name}
          </option>
        ))}
      </Select>
      <Select
        label="Date"
        value={query.periodKey ?? ''}
        onChange={(event) => onChange(query.with({ periodKey: Period.find(event.target.value)?.key ?? null }))}
        className={styles.select}
      >
        <option value="">Any date</option>
        {Period.all.map((period) => (
          <option key={period.key} value={period.key}>
            {period.label}
          </option>
        ))}
      </Select>
      <div className={styles.checks}>
        <Checkbox
          label="Highlights only"
          checked={query.highlightsOnly}
          onChange={(event) => onChange(query.with({ highlightsOnly: event.target.checked }))}
        />
        <Checkbox
          label="On view now"
          checked={query.onViewOnly}
          onChange={(event) => onChange(query.with({ onViewOnly: event.target.checked }))}
        />
        <Checkbox
          label="Include works without images"
          checked={query.includeImageless}
          onChange={(event) => onChange(query.with({ includeImageless: event.target.checked }))}
        />
      </div>
      {!query.equals(SearchQuery.empty) && (
        <Button variant="quiet" onClick={() => onChange(SearchQuery.empty)} className={styles.clear}>
          Clear
        </Button>
      )}
    </div>
  )
}
