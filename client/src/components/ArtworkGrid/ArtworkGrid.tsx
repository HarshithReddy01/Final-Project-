import type { ComponentProps } from 'react'
import { cx } from '../../lib/cx.ts'
import { Pagination } from '../../lib/met/Pagination.ts'
import { ArtworkCardSkeleton } from '../ArtworkCard/ArtworkCardSkeleton.tsx'
import styles from './ArtworkGrid.module.css'

export type ArtworkGridProps = ComponentProps<'ul'>

type ArtworkGridSkeletonProps = {
  readonly count?: number
  readonly label?: string
}

export function ArtworkGrid({ className, ...props }: ArtworkGridProps) {
  return <ul {...props} className={cx(styles.grid, className)} />
}

export function ArtworkGridSkeleton({ count = Pagination.pageSize, label = 'Loading works' }: ArtworkGridSkeletonProps) {
  return (
    <>
      <output className="visually-hidden">{label}</output>
      <ArtworkGrid aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <ArtworkCardSkeleton key={index} />
        ))}
      </ArtworkGrid>
    </>
  )
}
