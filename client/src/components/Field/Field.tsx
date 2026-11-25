import type { ReactNode } from 'react'
import { cx } from '../../lib/cx.ts'
import type { FieldIds } from '../../lib/forms/FieldIds.ts'
import styles from './Field.module.css'

type FieldProps = {
  readonly ids: FieldIds
  readonly label: string
  readonly hideLabel?: boolean
  readonly hint?: string | null
  readonly error?: string | null
  readonly aside?: ReactNode
  readonly className?: string
  readonly children: ReactNode
}

export function Field({ ids, label, hideLabel = false, hint, error, aside, className, children }: FieldProps) {
  const hasFooter = Boolean(hint) || Boolean(error) || aside !== undefined
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={ids.control} className={cx(styles.label, hideLabel && 'visually-hidden')}>
        {label}
      </label>
      {children}
      {hasFooter && (
        <div className={styles.footer}>
          <div className={styles.messages}>
            {error && (
              <p id={ids.error} className={styles.error}>
                {error}
              </p>
            )}
            {hint && (
              <p id={ids.hint} className={styles.hint}>
                {hint}
              </p>
            )}
          </div>
          {aside}
        </div>
      )}
    </div>
  )
}
