import { Link, useSearchParams } from 'react-router'
import type { To } from 'react-router'
import { cx } from '../../lib/cx.ts'
import { Pagination as PageModel } from '../../lib/met/Pagination.ts'
import typography from '../../styles/typography.module.css'
import { Icon } from '../Icon/Icon.tsx'
import styles from './Pagination.module.css'

type PaginationProps = {
  readonly pagination: PageModel
  readonly label?: string
  readonly className?: string
}

type StepProps = {
  readonly direction: 'previous' | 'next'
  readonly to: To | null
}

function Step({ direction, to }: StepProps) {
  const content =
    direction === 'previous' ? (
      <>
        <Icon name="arrow-left" />
        <span>Previous</span>
      </>
    ) : (
      <>
        <span>Next</span>
        <Icon name="arrow-right" />
      </>
    )
  if (to === null) {
    return (
      <span className={cx(styles.step, styles.unavailable)} aria-hidden="true">
        {content}
      </span>
    )
  }
  return (
    <Link to={to} rel={direction === 'previous' ? 'prev' : 'next'} className={styles.step}>
      {content}
    </Link>
  )
}

export function Pagination({ pagination, label = 'Pages', className }: PaginationProps) {
  const [searchParams] = useSearchParams()
  if (pagination.pageCount <= 1) return null

  const linkTo = (page: number): To => ({ search: PageModel.withPage(searchParams, page).toString() })
  const current = pagination.page

  return (
    <nav aria-label={label} className={cx(styles.pagination, className)}>
      <Step direction="previous" to={pagination.hasPrevious ? linkTo(current - 1) : null} />
      <ol className={styles.pages}>
        {pagination.visiblePages().map((item, index) =>
          item === 'gap' ? (
            <li key={index === 1 ? 'gap-start' : 'gap-end'} className={styles.gap} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                to={linkTo(item)}
                className={cx(styles.page, item === current && styles.current)}
                aria-current={item === current ? 'page' : undefined}
                aria-label={`Page ${item}`}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ol>
      <p className={cx(typography.label, styles.status)}>
        Page {current} of {pagination.pageCount}
      </p>
      <Step direction="next" to={pagination.hasNext ? linkTo(current + 1) : null} />
    </nav>
  )
}
